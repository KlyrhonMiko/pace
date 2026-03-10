"""
Survey distribution management routes.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.surveys import (
    SurveyDistributionConfigCreateRequest,
    SurveyDistributionConfigPublic,
    DistributionStatus,
)
from models.auth import CurrentUser
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from utils.timezone import get_current_time_gmt8
from utils.rbac import require_staff_or_admin
from services.queries.surveys_queries import get_survey_by_id
from services.queries.survey_distribution_queries import (
    get_distribution_config,
    configure_distribution,
    update_distribution_config,
    send_survey_invitations,
    send_survey_reminders,
    get_distribution_stats,
    get_non_respondents,
)


SURVEYS_CACHE_NAMESPACE = "surveys"
SURVEYS_DETAIL_TTL = 300
SURVEYS_ANALYTICS_TTL = 120

router = APIRouter(
    prefix="/surveys",
    tags=["survey-distribution"],
    dependencies=[Depends(require_staff_or_admin)],
)


# ---------------------------------------------------------------------------
# Distribution config
# ---------------------------------------------------------------------------


@router.post(
    "/{survey_id}/distribution/configure",
    response_model=StandardResponse,
    status_code=201,
)
def configure_distribution_route(
    survey_id: str,
    body: SurveyDistributionConfigCreateRequest,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Create or update survey distribution configuration"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_NOT_FOUND.value,
                    message="Survey not found",
                ).model_dump(mode="json"),
            )
        config = configure_distribution(
            session,
            survey,
            body,
            performed_by=current_user.user_code,
        )
        existing_existed = (
            get_distribution_config(session, survey.survey_code) is not None
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_CONFIG_UPDATED.value
            if existing_existed
            else SuccessCode.DISTRIBUTION_CONFIG_CREATED.value,
            message="Distribution config updated"
            if existing_existed
            else "Distribution config created",
            data=SurveyDistributionConfigPublic.model_validate(config),
            timestamp=get_current_time_gmt8(),
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


@router.get("/{survey_id}/distribution/config", response_model=StandardResponse)
def get_distribution_config_route(
    survey_id: str, session: Session = Depends(get_session)
):
    """Get distribution configuration for a survey"""
    try:
        cache_key = generate_cache_key(f"{SURVEYS_CACHE_NAMESPACE}:distribution_config", survey_id=survey_id)
        return cache_get_or_set(
            cache_key,
            lambda: _build_distribution_config_response(session, survey_id),
            ttl=SURVEYS_DETAIL_TTL,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


@router.patch("/{survey_id}/distribution/config", response_model=StandardResponse)
def update_distribution_config_route(
    survey_id: str,
    body: SurveyDistributionConfigCreateRequest,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Update distribution config (only in DRAFT status)"""
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_NOT_FOUND.value,
                    message="Survey not found",
                ).model_dump(mode="json"),
            )
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_CONFIG_NOT_FOUND.value,
                    message="Distribution config not found",
                ).model_dump(mode="json"),
            )
        if config.status != DistributionStatus.DRAFT:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_ALREADY_SENT.value,
                    message="Distribution already sent",
                ).model_dump(mode="json"),
            )
        updated = update_distribution_config(
            session,
            config,
            body,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_CONFIG_UPDATED.value,
            message="Distribution config updated",
            data=SurveyDistributionConfigPublic.model_validate(updated),
            timestamp=get_current_time_gmt8(),
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


# ---------------------------------------------------------------------------
# Distribution sending & stats
# ---------------------------------------------------------------------------


@router.post("/{survey_id}/distribution/send", response_model=StandardResponse)
def send_distribution_route(
    survey_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """
    Send invitations to all configured recipients.
    Creates SurveyInvitation records and marks the config as SENT.
    Actual email delivery is a future integration.
    """
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_NOT_FOUND.value,
                    message="Survey not found",
                ).model_dump(mode="json"),
            )
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_CONFIG_NOT_FOUND.value,
                    message="Distribution config not found. Create one first via POST /distribution/configure",
                ).model_dump(mode="json"),
            )
        if config.status == DistributionStatus.SENT:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_ALREADY_SENT.value,
                    message="Invitations have already been sent for this distribution",
                ).model_dump(mode="json"),
            )
        sent_count, _ = send_survey_invitations(
            session,
            survey,
            config,
            performed_by=current_user.user_code,
        )
        if sent_count == 0:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.NO_RECIPIENTS_FOUND.value,
                    message="No eligible alumni found matching the distribution filters",
                ).model_dump(mode="json"),
            )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_INVITATIONS_SENT.value,
            message=f"Invitations sent to {sent_count} alumni",
            data={"sent_count": sent_count, "distribution_id": config.distribution_id},
            timestamp=get_current_time_gmt8(),
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


@router.post(
    "/{survey_id}/distribution/send-reminders", response_model=StandardResponse
)
def send_reminders_route(
    survey_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """
    Send reminders to alumni who received an invitation but haven't responded yet.
    Re-timestamps their sent_at to indicate a reminder was sent.
    Actual email delivery is a future integration.
    """
    try:
        survey = get_survey_by_id(session, survey_id)
        if not survey:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.SURVEY_NOT_FOUND.value,
                    message="Survey not found",
                ).model_dump(mode="json"),
            )
        config = get_distribution_config(session, survey.survey_code)
        if not config:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DISTRIBUTION_CONFIG_NOT_FOUND.value,
                    message="Distribution config not found",
                ).model_dump(mode="json"),
            )
        if config.status != DistributionStatus.SENT:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Reminders can only be sent after the initial distribution has been sent",
                ).model_dump(mode="json"),
            )
        reminder_count, _ = send_survey_reminders(
            session,
            survey,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(SURVEYS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.DISTRIBUTION_REMINDERS_SENT.value,
            message=f"Reminders queued for {reminder_count} non-respondents",
            data={"reminder_count": reminder_count},
            timestamp=get_current_time_gmt8(),
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


@router.get("/{survey_id}/distribution/status", response_model=StandardResponse)
def get_distribution_status_route(
    survey_id: str, session: Session = Depends(get_session)
):
    """Get distribution statistics: total recipients, response rate, sent/responded/pending counts."""
    try:
        cache_key = generate_cache_key(f"{SURVEYS_CACHE_NAMESPACE}:distribution_status", survey_id=survey_id)
        return cache_get_or_set(
            cache_key,
            lambda: _build_distribution_status_response(session, survey_id),
            ttl=SURVEYS_ANALYTICS_TTL,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


@router.get(
    "/{survey_id}/distribution/non-respondents", response_model=StandardResponse
)
def get_non_respondents_route(
    survey_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    session: Session = Depends(get_session),
):
    """List alumni who received an invitation but have not yet submitted a response."""
    try:
        cache_key = generate_cache_key(
            f"{SURVEYS_CACHE_NAMESPACE}:non_respondents",
            survey_id=survey_id,
            skip=skip,
            limit=limit,
        )
        return cache_get_or_set(
            cache_key,
            lambda: _build_non_respondents_response(session, survey_id, skip, limit),
            ttl=SURVEYS_ANALYTICS_TTL,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ).model_dump(mode="json"),
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_required_survey(session: Session, survey_id: str):
    survey = get_survey_by_id(session, survey_id)
    if not survey:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.SURVEY_NOT_FOUND.value,
                message="Survey not found",
            ).model_dump(mode="json"),
        )
    return survey


def _get_required_distribution_config(session: Session, survey_id: str):
    survey = _get_required_survey(session, survey_id)
    config = get_distribution_config(session, survey.survey_code)
    if not config:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.DISTRIBUTION_CONFIG_NOT_FOUND.value,
                message="Distribution config not found",
            ).model_dump(mode="json"),
        )
    return survey, config


def _build_distribution_config_response(session: Session, survey_id: str) -> StandardResponse:
    _, config = _get_required_distribution_config(session, survey_id)
    return StandardResponse(
        success=True,
        code=SuccessCode.DISTRIBUTION_CONFIG_RETRIEVED.value,
        message="Distribution config retrieved",
        data=SurveyDistributionConfigPublic.model_validate(config),
        timestamp=get_current_time_gmt8(),
    )


def _build_distribution_status_response(session: Session, survey_id: str) -> StandardResponse:
    survey, config = _get_required_distribution_config(session, survey_id)
    stats = get_distribution_stats(session, survey.survey_code, config)
    return StandardResponse(
        success=True,
        code=SuccessCode.DISTRIBUTION_STATUS_RETRIEVED.value,
        message="Distribution status retrieved",
        data=stats,
        timestamp=get_current_time_gmt8(),
    )


def _build_non_respondents_response(
    session: Session,
    survey_id: str,
    skip: int,
    limit: int,
) -> StandardResponse:
    survey, _ = _get_required_distribution_config(session, survey_id)
    non_respondents, total = get_non_respondents(session, survey.survey_code, skip, limit)
    return StandardResponse(
        success=True,
        code=SuccessCode.DISTRIBUTION_STATUS_RETRIEVED.value,
        message="Non-respondents retrieved",
        data={
            "non_respondents": non_respondents,
            "total": total,
            "count": len(non_respondents),
            "offset": skip,
            "limit": limit,
            "has_more": (skip + limit) < total,
        },
        timestamp=get_current_time_gmt8(),
    )
