from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from core.database import get_session
from models.auth import CurrentUser
from models.pagination import PaginationMetadata
from models.response_codes import ErrorCode, StandardResponse
from models.transaction_logs import TransactionLog
from utils.rbac import require_admin
from services.queries.transaction_logs_queries import (
    get_transaction_logs,
    lookup_transaction_log_by_id,
    get_user_by_id_ref,
)

router = APIRouter(prefix="/transaction-logs", tags=["transaction-logs"])


def _build_transaction_log_payload(session: Session, log: TransactionLog) -> dict:
    performed_by_user_id = None
    if log.performed_by_ref_id:
        user = get_user_by_id_ref(session, log.performed_by_ref_id)
        if user:
            performed_by_user_id = user.user_id

    return {
        "tl_id": log.tl_id,
        "tl_name": log.tl_name,
        "before": log.before,
        "after": log.after,
        "tl_date": log.tl_date,
        "performed_by": performed_by_user_id,
    }


@router.get("", response_model=StandardResponse)
def list_transaction_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=0),
    search: str | None = Query(
        default=None,
        description="Search by tl_id or tl_name",
    ),
    action_type: str | None = Query(
        default=None,
        description="Filter by action text in tl_name (e.g., CREATE, UPDATE, DELETE, RESTORE)",
    ),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Admin-only paginated transaction log listing with optional search filters."""
    _ = current_user

    logs, total = get_transaction_logs(session, skip, limit, search, action_type)
    returned = len(logs)

    pagination = PaginationMetadata(
        total=total,
        limit=limit,
        offset=skip,
        returned=returned,
        has_next=(skip + returned) < total if limit > 0 else False,
    )

    return StandardResponse(
        success=True,
        code="TRANSACTION_LOGS_RETRIEVED",
        message=f"Retrieved {returned} transaction log(s)",
        data={
            "transaction_logs": [_build_transaction_log_payload(session, log) for log in logs],
            "pagination": pagination.model_dump(mode="json"),
        },
    )


@router.delete("/purge", response_model=StandardResponse)
def purge_transaction_logs(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Admin-only: soft-delete all transaction logs. Returns count of purged records."""
    import uuid as _uuid
    from utils.timezone import get_current_time_gmt8
    from sqlmodel import select as _select

    logs = session.exec(
        _select(TransactionLog).where(TransactionLog.is_deleted == False)
    ).all()

    now = get_current_time_gmt8()
    count = 0
    for log in logs:
        log.is_deleted = True
        log.deleted_at = now
        log.deleted_by = current_user.id
        session.add(log)
        count += 1

    session.commit()

    return StandardResponse(
        success=True,
        code="TRANSACTION_LOGS_PURGED",
        message=f"Purged {count} transaction log(s)",
        data={"purged_count": count},
    )

@router.get("/{tl_id}", response_model=StandardResponse)
def get_transaction_log_by_id(
    tl_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Admin-only endpoint to fetch a single transaction log by human-readable tl_id."""
    _ = current_user

    normalized_tl_id = tl_id.strip()
    if not normalized_tl_id:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="tl_id is required",
            ).model_dump(mode="json"),
        )

    transaction_log = lookup_transaction_log_by_id(session, normalized_tl_id)
    if not transaction_log:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code="TRANSACTION_LOG_NOT_FOUND",
                message="Transaction log not found",
            ).model_dump(mode="json"),
        )

    return StandardResponse(
        success=True,
        code="TRANSACTION_LOG_RETRIEVED",
        message="Transaction log retrieved successfully",
        data=_build_transaction_log_payload(session, transaction_log),
    )
