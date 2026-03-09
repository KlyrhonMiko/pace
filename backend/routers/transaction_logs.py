from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, text
from sqlmodel import Session, func, select

from core.database import get_session
from models.auth import CurrentUser
from models.users import User
from models.pagination import PaginationMetadata
from models.response_codes import ErrorCode, StandardResponse
from models.transaction_logs import TransactionLog
from utils.rbac import require_admin

router = APIRouter(prefix="/transaction-logs", tags=["transaction-logs"])


def _build_transaction_log_payload(session: Session, log: TransactionLog) -> dict:
    performed_by_user_id = None
    if log.performed_by:
        user = session.get(User, log.performed_by)
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

    logs_stmt = select(TransactionLog)
    count_stmt = select(func.count()).select_from(TransactionLog)

    if search:
        normalized_search = search.strip().lower()
        search_condition = or_(
            func.lower(TransactionLog.tl_id).contains(normalized_search),
            func.lower(TransactionLog.tl_name).contains(normalized_search),
        )
        logs_stmt = logs_stmt.where(search_condition)
        count_stmt = count_stmt.where(search_condition)

    if action_type:
        normalized_action_type = action_type.strip().lower()
        action_condition = func.lower(TransactionLog.tl_name).contains(normalized_action_type)
        logs_stmt = logs_stmt.where(action_condition)
        count_stmt = count_stmt.where(action_condition)

    logs_stmt = logs_stmt.order_by(text("tl_date DESC")).offset(skip)
    if limit > 0:
        logs_stmt = logs_stmt.limit(limit)

    logs = session.exec(logs_stmt).all()
    total = int(session.exec(count_stmt).one() or 0)
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

    transaction_log = session.exec(
        select(TransactionLog).where(TransactionLog.tl_id == normalized_tl_id)
    ).first()
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
