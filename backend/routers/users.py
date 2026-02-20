from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from models.users import (
    User, UserCreate, UserUpdate, UserPublic, UserType, SuccessResponse,
    UserBatchCreate, UserBatchCreateItem, UserBatchCreateResponse, UserCreateSafeDisplay,
    UserBatchUpdate, UserBatchUpdateItem, UserBatchUpdateResult, UserBatchUpdateResponse, UserUpdateSafeDisplay,
    UserBatchDelete, UserBatchDeleteResult, UserBatchDeleteResponse,
    UserBatchRestore, UserBatchRestoreResult, UserBatchRestoreResponse
)
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from models.pagination import PaginatedResponse, PaginationMetadata
from models.alumni import Alumni
from models.student_records import StudentRecord
from utils.auth import verify_password
from utils.logging import log_error, log_integrity_error, log_auth_error
from utils.timezone import get_current_time_gmt8
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])


def generate_user_id(user_type: UserType, session: Session) -> str:
    """Generate user_id based on user_type with auto-increment"""
    prefix = user_type.value  # USER, STAFF, or ADMIN
    
    # Find the last user of this type
    last_user = session.exec(
        select(User).where(User.user_type == user_type).order_by(User.user_id.desc())
    ).first()
    
    if last_user:
        # Extract number and increment
        last_num = int(last_user.user_id.split("-")[1])
        new_num = last_num + 1
    else:
        # Start from 1 if no users of this type exist
        new_num = 1
    
    return f"{prefix}-{new_num:06d}"  # USER-000001, STAFF-000001, ADMIN-000001


@router.post("")
def create_user(
    user_data: UserCreate,
    session: Session = Depends(get_session)
):
    """Create a new user account"""
    # Generate user_id based on user_type
    user_id = generate_user_id(user_data.user_type, session)
    
    # Create user with generated ID
    new_user = User(
        user_id=user_id,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,  # Already hashed by validator
        user_type=user_data.user_type
    )
    session.add(new_user)
    
    try:
        session.commit()
        session.refresh(new_user)
        return StandardResponse(
            success=True,
            code=SuccessCode.USER_CREATED.value,
            message=f"User {user_id} created successfully",
            data=UserPublic.model_validate(new_user)
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        # Check which field caused the violation by looking at constraint name
        if "ix_users_email" in error_str or "users_email_key" in error_str:
            log_integrity_error("users", "create_user", ErrorCode.DUPLICATE_EMAIL.value, "Email already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_EMAIL.value,
                    message="Email already in use"
                ).model_dump(mode='json')
            )
        elif "ix_users_username" in error_str or "users_username_key" in error_str:
            log_integrity_error("users", "create_user", ErrorCode.DUPLICATE_USERNAME.value, "Username already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_USERNAME.value,
                    message="Username already in use"
                ).model_dump(mode='json')
            )
        else:
            log_integrity_error("users", "create_user", ErrorCode.INVALID_INPUT.value, "User creation failed", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="User with these details already exists"
                ).model_dump(mode='json')
            )


@router.post("/batch")
def batch_create_users(
    batch_data: UserBatchCreate,
    session: Session = Depends(get_session)
):
    """Batch create users"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, user_item in enumerate(batch_data.items):
        try:
            with session.begin_nested():
                # Generate user_id based on user_type
                user_id = generate_user_id(user_item.user_type, session)
                
                # Create user
                user_dict = user_item.model_dump()
                user_dict["user_id"] = user_id
                
                new_user = User.model_validate(user_dict)
                session.add(new_user)
                session.flush()  # Flush to get the ID but don't commit yet
                session.refresh(new_user)
                
                # Record successful creation
                results.append(UserBatchCreateItem(
                    index=index,
                    item=UserCreateSafeDisplay(
                        username=user_item.username,
                        email=user_item.email,
                        user_type=user_item.user_type
                    ),
                    success=True,
                    code=SuccessCode.USER_CREATED.value,
                    message="User created successfully",
                    data=UserPublic.model_validate(new_user)
                ))
                successful_count += 1
        
        except IntegrityError as e:
            # session.rollback() is handled automatically by the context manager on error
            error_str = str(e).lower()
            
            if "ix_users_email" in error_str or "users_email_key" in error_str:
                error_code = ErrorCode.DUPLICATE_EMAIL.value
                error_msg = f"Email '{user_item.email}' already exists"
            elif "ix_users_username" in error_str or "users_username_key" in error_str:
                error_code = ErrorCode.DUPLICATE_USERNAME.value
                error_msg = f"Username '{user_item.username}' already exists"
            else:
                error_code = ErrorCode.INVALID_INPUT.value
                error_msg = "User creation failed due to constraint violation"
            
            results.append(UserBatchCreateItem(
                index=index,
                item=UserCreateSafeDisplay(
                    username=user_item.username,
                    email=user_item.email,
                    user_type=user_item.user_type
                ),
                success=False,
                code=error_code,
                message=error_msg,
                data=None
            ))
            failed_count += 1
        
        except ValueError as e:
            error_msg = str(e)
            error_code = ErrorCode.INVALID_INPUT.value
            
            results.append(UserBatchCreateItem(
                index=index,
                item=UserCreateSafeDisplay(
                    username=user_item.username,
                    email=user_item.email,
                    user_type=user_item.user_type
                ),
                success=False,
                code=error_code,
                message=error_msg,
                data=None
            ))
            failed_count += 1
    
    # Commit all successful operations
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Batch create operation failed during commit"
            ).model_dump(mode='json')
        )
    
    batch_response = UserBatchCreateResponse(
        total_items=len(batch_data.items),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,  # True only if all succeeded
        code=SuccessCode.USERS_BATCH_CREATED.value,
        message=f"Batch create completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.get("")
def get_all_users(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by username or email"),
    user_type: str = Query(None, description="Filter by user type (USER, STAFF, ADMIN)"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    sort_by: str = Query("user_id", description="Sort by field (user_id, username, email, created_at)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all users with filtering, searching, and sorting"""
    # Build query
    query = select(User) if include_deleted else select(User).where(User.is_deleted == False)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(
            (User.username.ilike(search_like)) | (User.email.ilike(search_like))
        )
    
    # Apply user_type filter
    if user_type:
        query = query.where(User.user_type == user_type.upper())
    
    # Get total count after filters
    count_query = select(func.count(User.user_code)) if include_deleted else select(func.count(User.user_code)).where(User.is_deleted == False)
    total = session.exec(count_query).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "username":
        query = query.order_by(User.username.desc() if sort_order_desc else User.username)
    elif sort_by.lower() == "email":
        query = query.order_by(User.email.desc() if sort_order_desc else User.email)
    elif sort_by.lower() == "created_at":
        query = query.order_by(User.created_at.desc() if sort_order_desc else User.created_at)
    else:  # default to user_id
        query = query.order_by(User.user_id.desc() if sort_order_desc else User.user_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    users = session.exec(query).all()
    
    # Convert User objects to UserPublic
    public_users = [UserPublic.model_validate(user) for user in users]
    
    # Calculate pagination metadata
    returned = len(users)
    has_next = (offset + returned) < total if limit > 0 else False
    
    pagination = PaginationMetadata(
        total=total,
        limit=limit,
        offset=offset,
        returned=returned,
        has_next=has_next
    )
    
    return StandardResponse(
        success=True,
        code=SuccessCode.USERS_RETRIEVED.value,
        message=f"Retrieved {returned} users",
        data={"users": public_users, "pagination": pagination}
    )


@router.get("/{user_id}")
def get_user(user_id: str, session: Session = Depends(get_session)):
    """Get a specific user by user_id"""
    user = session.exec(
        select(User).where((User.user_id == user_id.upper()) & (User.is_deleted == False))
    ).first()
    
    if not user:
        log_error("users", "get_user", ErrorCode.USER_NOT_FOUND.value, f"User {user_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.USER_NOT_FOUND.value,
                message="User not found"
            ).model_dump(mode='json')
        )
    return StandardResponse(
        success=True,
        code=SuccessCode.USER_RETRIEVED.value,
        message=f"User {user_id} retrieved successfully",
        data=UserPublic.model_validate(user)
    )


@router.put("/batch")
def batch_update_users(
    batch_data: UserBatchUpdate,
    session: Session = Depends(get_session)
):
    """Batch update users"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, update_item in enumerate(batch_data.items):
        try:
            with session.begin_nested():
                # Find the user
                user = session.exec(
                    select(User).where(User.user_id == update_item.user_id.upper())
                ).first()
                
                if not user:
                    results.append(UserBatchUpdateResult(
                        index=index,
                        item=UserUpdateSafeDisplay(
                            user_id=update_item.user_id,
                            username=update_item.username,
                            email=update_item.email
                        ),
                        success=False,
                        code=ErrorCode.USER_NOT_FOUND.value,
                        message=f"User {update_item.user_id} not found",
                        data=None
                    ))
                    failed_count += 1
                    continue
                
                # If password change is requested, verify current password
                if update_item.password is not None:
                    if update_item.current_password is None:
                        results.append(UserBatchUpdateResult(
                            index=index,
                            item=UserUpdateSafeDisplay(
                                user_id=update_item.user_id,
                                username=update_item.username,
                                email=update_item.email
                            ),
                            success=False,
                            code=ErrorCode.MISSING_CURRENT_PASSWORD.value,
                            message="Current password required to change password",
                            data=None
                        ))
                        failed_count += 1
                        continue
                    
                    # Verify the current password
                    if not verify_password(update_item.current_password, user.password):
                        results.append(UserBatchUpdateResult(
                            index=index,
                            item=UserUpdateSafeDisplay(
                                user_id=update_item.user_id,
                                username=update_item.username,
                                email=update_item.email
                            ),
                            success=False,
                            code=ErrorCode.INVALID_CREDENTIALS.value,
                            message="Current password is incorrect",
                            data=None
                        ))
                        failed_count += 1
                        continue
                
                # Update only provided fields
                if update_item.username is not None:
                    user.username = update_item.username
                if update_item.email is not None:
                    user.email = update_item.email
                if update_item.password is not None:
                    # Password is already hashed by validator in UserBatchUpdateItem
                    user.password = update_item.password
                
                session.add(user)
                session.flush()
                session.refresh(user)
                
                # Record successful update
                results.append(UserBatchUpdateResult(
                    index=index,
                    item=UserUpdateSafeDisplay(
                        user_id=update_item.user_id,
                        username=update_item.username,
                        email=update_item.email
                    ),
                    success=True,
                    code=SuccessCode.USER_UPDATED.value,
                    message="User updated successfully",
                    data=UserPublic.model_validate(user)
                ))
                successful_count += 1
        
        except IntegrityError as e:
            # session.rollback() is handled automatically by the context manager on error
            error_str = str(e).lower()
            
            if "ix_users_email" in error_str or "users_email_key" in error_str:
                error_code = ErrorCode.DUPLICATE_EMAIL.value
                error_msg = f"Email already exists"
            elif "ix_users_username" in error_str or "users_username_key" in error_str:
                error_code = ErrorCode.DUPLICATE_USERNAME.value
                error_msg = f"Username already exists"
            else:
                error_code = ErrorCode.INVALID_INPUT.value
                error_msg = "User update failed due to constraint violation"
            
            results.append(UserBatchUpdateResult(
                index=index,
                item=UserUpdateSafeDisplay(
                    user_id=update_item.user_id,
                    username=update_item.username,
                    email=update_item.email
                ),
                success=False,
                code=error_code,
                message=error_msg,
                data=None
            ))
            failed_count += 1
        
        except ValueError as e:
            error_msg = str(e)
            error_code = ErrorCode.INVALID_INPUT.value
            
            results.append(UserBatchUpdateResult(
                index=index,
                item=UserUpdateSafeDisplay(
                    user_id=update_item.user_id,
                    username=update_item.username,
                    email=update_item.email
                ),
                success=False,
                code=error_code,
                message=error_msg,
                data=None
            ))
            failed_count += 1
    
    # Commit all successful operations
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Batch update operation failed during commit"
            ).model_dump(mode='json')
        )
    
    batch_response = UserBatchUpdateResponse(
        total_items=len(batch_data.items),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.USERS_BATCH_UPDATED.value,
        message=f"Batch update completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.put("/{user_id}")
def update_user(
    user_id: str,
    user_data: UserUpdate,
    session: Session = Depends(get_session)
):
    """Update a user's information. If changing password, current_password is required."""
    user = session.exec(
        select(User).where(User.user_id == user_id.upper())
    ).first()
    
    if not user:
        log_error("users", "update_user", ErrorCode.USER_NOT_FOUND.value, f"User {user_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.USER_NOT_FOUND.value,
                message="User not found"
            ).model_dump(mode='json')
        )
    
    # If password change is requested, verify current password
    if user_data.password is not None:
        if user_data.current_password is None:
            log_error("users", "update_user", ErrorCode.MISSING_CURRENT_PASSWORD.value, "Current password required but not provided")
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.MISSING_CURRENT_PASSWORD.value,
                    message="Current password required to change password"
                ).model_dump(mode='json')
            )
        
        # Verify the current password
        if not verify_password(user_data.current_password, user.password):
            log_auth_error("update_user", user.username, ErrorCode.INVALID_CREDENTIALS.value, "Incorrect current password")
            raise HTTPException(
                status_code=401,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_CREDENTIALS.value,
                    message="Current password is incorrect"
                ).model_dump(mode='json')
            )
    
    # Update only provided fields
    if user_data.username is not None:
        user.username = user_data.username
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.password is not None:
        # Password is already hashed by validator in UserUpdate
        user.password = user_data.password
    
    session.add(user)
    
    try:
        session.commit()
        
        # Return user-friendly success message
        return StandardResponse(
            success=True,
            code=SuccessCode.USER_UPDATED.value,
            message=f"User {user.user_id} updated successfully",
            data=UserPublic.model_validate(user)
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_users_email" in error_str or "users_email_key" in error_str:
            log_integrity_error("users", "update_user", ErrorCode.DUPLICATE_EMAIL.value, "Email already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_EMAIL.value,
                    message="Email already in use"
                ).model_dump(mode='json')
            )
        elif "ix_users_username" in error_str or "users_username_key" in error_str:
            log_integrity_error("users", "update_user", ErrorCode.DUPLICATE_USERNAME.value, "Username already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_USERNAME.value,
                    message="Username already in use"
                ).model_dump(mode='json')
            )
        else:
            log_integrity_error("users", "update_user", ErrorCode.INVALID_INPUT.value, "Update failed", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Update failed: Duplicate entry"
                ).model_dump(mode='json')
            )


@router.delete("/batch")
def batch_delete_users(
    batch_data: UserBatchDelete,
    session: Session = Depends(get_session)
):
    """Batch delete users"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, user_id in enumerate(batch_data.ids):
        try:
            # Find the user
            user = session.exec(
                select(User).where(User.user_id == user_id.upper())
            ).first()
            
            if not user:
                results.append(UserBatchDeleteResult(
                    index=index,
                    user_id=user_id,
                    success=False,
                    code=ErrorCode.USER_NOT_FOUND.value,
                    message=f"User {user_id} not found"
                ))
                failed_count += 1
                continue
            
            # Check if already deleted
            if user.is_deleted:
                results.append(UserBatchDeleteResult(
                    index=index,
                    user_id=user_id,
                    success=False,
                    code=ErrorCode.ALREADY_DELETED.value,
                    message="User is already deleted, cannot delete again"
                ))
                failed_count += 1
                continue
            
            # Cascade soft delete to associated alumni
            alumni_records = session.exec(
                select(Alumni).where(Alumni.user_code == user.user_code)
            ).all()
            for alumni in alumni_records:
                alumni.is_deleted = True
                alumni.deleted_at = get_current_time_gmt8()
                session.add(alumni)
                
                # Also cascade delete associated student records
                student_records = session.exec(
                    select(StudentRecord).where(StudentRecord.alumni_code == alumni.alumni_code)
                ).all()
                for student in student_records:
                    student.is_deleted = True
                    student.deleted_at = get_current_time_gmt8()
                    session.add(student)
            
            # Soft delete the user
            user.is_deleted = True
            user.deleted_at = get_current_time_gmt8()
            session.add(user)
            session.flush()
            
            # Record successful deletion
            results.append(UserBatchDeleteResult(
                index=index,
                user_id=user_id,
                success=True,
                code=SuccessCode.USER_DELETED.value,
                message="User deleted successfully"
            ))
            successful_count += 1
        
        except IntegrityError as e:
            session.rollback()
            results.append(UserBatchDeleteResult(
                index=index,
                user_id=user_id,
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="User deletion failed due to constraint violation"
            ))
            failed_count += 1
        
        except ValueError as e:
            error_msg = str(e)
            results.append(UserBatchDeleteResult(
                index=index,
                user_id=user_id,
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message=error_msg
            ))
            failed_count += 1
    
    # Commit all successful operations
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Batch delete operation failed during commit"
            ).model_dump(mode='json')
        )
    
    batch_response = UserBatchDeleteResponse(
        total_items=len(batch_data.ids),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.USERS_BATCH_DELETED.value,
        message=f"Batch delete completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    password: str,
    session: Session = Depends(get_session)
):
    """Delete a user account (requires password confirmation)"""
    user = session.exec(
        select(User).where(User.user_id == user_id.upper())
    ).first()
    
    if not user:
        log_error("users", "delete_user", ErrorCode.USER_NOT_FOUND.value, f"User {user_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.USER_NOT_FOUND.value,
                message="User not found"
            ).model_dump(mode='json')
        )
    
    if user.is_deleted:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALREADY_DELETED.value,
                message="User is already deleted, cannot delete again"
            ).model_dump(mode='json')
        )
    
    # Verify password before deletion
    if not verify_password(password, user.password):
        log_auth_error("delete_user", user.username, ErrorCode.INVALID_CREDENTIALS.value, "Incorrect password on deletion")
        raise HTTPException(
            status_code=401,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_CREDENTIALS.value,
                message="Password is incorrect"
            ).model_dump(mode='json')
        )
    
    try:
        # Cascade soft delete to associated alumni
        alumni_records = session.exec(
            select(Alumni).where(Alumni.user_code == user.user_code)
        ).all()
        for alumni in alumni_records:
            if not alumni.is_deleted:
                alumni.is_deleted = True
                alumni.deleted_at = get_current_time_gmt8()
                session.add(alumni)
                
                # Also cascade delete associated student records
                student_records = session.exec(
                    select(StudentRecord).where(StudentRecord.alumni_code == alumni.alumni_code)
                ).all()
                for student in student_records:
                    if not student.is_deleted:
                        student.is_deleted = True
                        student.deleted_at = get_current_time_gmt8()
                        session.add(student)
        
        # Soft delete the user
        user.is_deleted = True
        user.deleted_at = get_current_time_gmt8()
        session.add(user)
        session.commit()
        return StandardResponse(
            success=True,
            code=SuccessCode.USER_DELETED.value,
            message=f"User {user_id} deleted successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("users", "delete_user", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Delete failed: Constraint violation or invalid operation"
            ).model_dump(mode='json')
        )




@router.post("/batch/restore")
def batch_restore_users(
    data: UserBatchRestore,
    session: Session = Depends(get_session)
):
    """Restore multiple soft-deleted users"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, user_id in enumerate(data.ids):
        try:
            user = session.exec(
                select(User).where(User.user_id == user_id.upper())
            ).first()
            
            if not user:
                results.append(UserBatchRestoreResult(
                    index=index,
                    user_id=user_id,
                    success=False,
                    code=ErrorCode.USER_NOT_FOUND.value,
                    message=f"User '{user_id}' not found"
                ))
                failed_count += 1
                continue
            
            if not user.is_deleted:
                results.append(UserBatchRestoreResult(
                    index=index,
                    user_id=user_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"User '{user_id}' is not deleted"
                ))
                failed_count += 1
                continue
            
            # Restore user
            user.is_deleted = False
            user.deleted_at = None
            session.add(user)
            session.flush()
            
            # Record successful restoration
            results.append(UserBatchRestoreResult(
                index=index,
                user_id=user_id,
                success=True,
                code=SuccessCode.USER_RESTORED.value,
                message="User restored successfully"
            ))
            successful_count += 1
        
        except IntegrityError as e:
            session.rollback()
            error_code = ErrorCode.INVALID_INPUT.value
            error_msg = "Restore failed: Constraint violation or related data issue"
            results.append(UserBatchRestoreResult(
                index=index,
                user_id=user_id,
                success=False,
                code=error_code,
                message=error_msg
            ))
            log_integrity_error("users", "batch_restore_users", error_code, error_msg, str(e))
            failed_count += 1
    
    session.commit()
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.USERS_BATCH_RESTORED.value,
        message=f"Restore operation completed: {successful_count} succeeded, {failed_count} failed",
        data=UserBatchRestoreResponse(
            total_items=len(data.ids),
            successful=successful_count,
            failed=failed_count,
            results=results
        )
    )


@router.post("/{user_id}/restore")
def restore_user(user_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted user"""
    user = session.exec(
        select(User).where(User.user_id == user_id.upper())
    ).first()
    
    if not user:
        log_error("users", "restore_user", ErrorCode.USER_NOT_FOUND.value, f"User {user_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.USER_NOT_FOUND.value,
                message="User not found"
            ).model_dump(mode='json')
        )
    
    if not user.is_deleted:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="User is not deleted, cannot restore"
            ).model_dump(mode='json')
        )
    
    try:
        # Restore soft-deleted user
        user.is_deleted = False
        user.deleted_at = None
        session.add(user)
        session.commit()
        return StandardResponse(
            success=True,
            code=SuccessCode.USER_RESTORED.value,
            message=f"User {user_id} restored successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("users", "restore_user", ErrorCode.INVALID_INPUT.value, "Restore failed", str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Restore failed: Constraint violation or invalid operation"
            ).model_dump(mode='json')
        )


@router.get("/deleted/list")
def get_deleted_users(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by username or email"),
    sort_by: str = Query("deleted_at", description="Sort by field (user_id, username, email, deleted_at)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all soft-deleted users (admin endpoint)"""
    # Build query - only show deleted records
    query = select(User).where(User.is_deleted == True)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(
            (User.username.ilike(search_like)) | (User.email.ilike(search_like))
        )
    
    # Get total count
    total = session.exec(select(func.count(User.user_code)).where(User.is_deleted == True)).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "username":
        query = query.order_by(User.username.desc() if sort_order_desc else User.username)
    elif sort_by.lower() == "email":
        query = query.order_by(User.email.desc() if sort_order_desc else User.email)
    elif sort_by.lower() == "deleted_at":
        query = query.order_by(User.deleted_at.desc() if sort_order_desc else User.deleted_at)
    else:  # default to user_id
        query = query.order_by(User.user_id.desc() if sort_order_desc else User.user_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    users = session.exec(query).all()
    
    # Convert User objects to UserPublic
    public_users = [UserPublic.model_validate(user) for user in users]
    
    # Calculate pagination metadata
    returned = len(users)
    has_next = (offset + returned) < total if limit > 0 else False
    
    pagination = PaginationMetadata(
        total=total,
        limit=limit,
        offset=offset,
        returned=returned,
        has_next=has_next
    )
    
    return PaginatedResponse(
        success=True,
        code=SuccessCode.USERS_RETRIEVED.value,
        message=f"Retrieved {returned} deleted users",
        data=public_users,
        pagination=pagination
    )


@router.get("/all/list")
def get_all_users_including_deleted(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by username or email"),
    user_type: str = Query(None, description="Filter by user type (USER, STAFF, ADMIN)"),
    sort_by: str = Query("user_id", description="Sort by field (user_id, username, email, created_at)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all users including soft-deleted (admin endpoint)"""
    # Build query - include all records
    query = select(User)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(
            (User.username.ilike(search_like)) | (User.email.ilike(search_like))
        )
    
    # Apply user_type filter
    if user_type:
        query = query.where(User.user_type == user_type.upper())
    
    # Get total count
    total = session.exec(select(func.count(User.user_code))).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "username":
        query = query.order_by(User.username.desc() if sort_order_desc else User.username)
    elif sort_by.lower() == "email":
        query = query.order_by(User.email.desc() if sort_order_desc else User.email)
    elif sort_by.lower() == "created_at":
        query = query.order_by(User.created_at.desc() if sort_order_desc else User.created_at)
    else:  # default to user_id
        query = query.order_by(User.user_id.desc() if sort_order_desc else User.user_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    users = session.exec(query).all()
    
    # Convert User objects to UserPublic
    public_users = [UserPublic.model_validate(user) for user in users]
    
    # Calculate pagination metadata
    returned = len(users)
    has_next = (offset + returned) < total if limit > 0 else False
    
    pagination = PaginationMetadata(
        total=total,
        limit=limit,
        offset=offset,
        returned=returned,
        has_next=has_next
    )
    
    return PaginatedResponse(
        success=True,
        code=SuccessCode.USERS_RETRIEVED.value,
        message=f"Retrieved {returned} users (including deleted)",
        data=public_users,
        pagination=pagination
    )

