from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from models.users import User, UserType
from models.courses import Course
from models.student_records import StudentRecord
from models.alumni import Alumni, AlumniCreate, AlumniUpdate, AlumniPublic
from models.composite import (
    CompleteAlumniRegistration, CompleteAlumniResponse,
    BatchAlumniRegister, BatchAlumniRegistrationResult, BatchAlumniRegisterResponse, BatchAlumniRegistrationItemSafeDisplay,
    BatchAlumniUpdate, BatchAlumniUpdateItem, BatchAlumniUpdateResult, BatchAlumniUpdateResponse,
    BatchAlumniDelete, BatchAlumniDeleteResult, BatchAlumniDeleteResponse,
    BatchAlumniRestore, BatchAlumniRestoreResult, BatchAlumniRestoreResponse
)
from models.responses import AlumniFullProfile
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from models.pagination import PaginatedResponse, PaginationMetadata
from utils.logging import log_error, log_integrity_error
from utils.auth import hash_password
from utils.timezone import get_current_time_gmt8

router = APIRouter(prefix="/alumni", tags=["alumni"])


@router.post("/register")
def register_complete_alumni(
    data: CompleteAlumniRegistration,
    session: Session = Depends(get_session)
):
    """
    Create a complete alumni profile in one transaction:
    1. Create User account
    2. Create Alumni profile (linked to User)
    
    Student record can be created separately via POST /student-records
    This ensures data integrity - if any step fails, nothing is saved.
    """
    try:
        # Generate user_id based on user_type
        user_type = UserType.USER
        last_user = session.exec(
            select(User).where(User.user_type == user_type).order_by(User.user_id.desc())
        ).first()
        
        # Auto increment user_id
        if last_user:
            last_num = int(last_user.user_id.split("-")[1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        user_id = f"USER-{new_num:06d}"  # Format: USER-000001
        
        # Generate alumni_id
        last_alumni = session.exec(
            select(Alumni).order_by(Alumni.alumni_id.desc())
        ).first()
        
        # Auto increment alumni_id
        if last_alumni and last_alumni.alumni_id.startswith("ALMN-"):
            last_alumni_num = int(last_alumni.alumni_id.split("-")[1])
            new_alumni_num = last_alumni_num + 1
        else:
            new_alumni_num = 1
        
        alumni_id = f"ALMN-{new_alumni_num:06d}"  # Format: ALMN-000001
        
        # Step 1: Create User
        new_user = User(
            user_id=user_id,
            username=data.username,
            email=data.email,
            password=data.password,  # Already hashed by validator
            user_type=UserType.USER
        )
        session.add(new_user)
        session.flush()  # Get UUID without committing
        
        # Step 2: Create Alumni (linked to User, without student_code)
        new_alumni = Alumni(
            alumni_id=alumni_id,
            last_name=data.last_name,
            first_name=data.first_name,
            middle_name=data.middle_name,
            gender=data.gender,
            age=data.age,
            user_code=new_user.user_code
        )
        session.add(new_alumni)
        
        # Commit everything at once
        session.commit()
        
        return StandardResponse(
            success=True,
            code=SuccessCode.ALUMNI_CREATED.value,
            message="Alumni profile created successfully",
            data={
                "user_id": new_user.user_id,
                "alumni_id": new_alumni.alumni_id
            }
        )
        
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        print(f"DEBUG IntegrityError: {str(e)}")  # Log the actual error
        # Check which field caused the violation by looking at constraint name
        if "ix_users_email" in error_str or "users_email_key" in error_str:
            log_integrity_error("alumni", "register_complete_alumni", ErrorCode.DUPLICATE_EMAIL.value, "Email already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_EMAIL.value,
                    message="Email already in use"
                ).model_dump(mode='json')
            )
        elif "ix_users_username" in error_str or "users_username_key" in error_str:
            log_integrity_error("alumni", "register_complete_alumni", ErrorCode.DUPLICATE_USERNAME.value, "Username already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_USERNAME.value,
                    message="Username already in use"
                ).model_dump(mode='json')
            )
        elif "ix_alumni_alumni_id" in error_str or "alumni_alumni_id_key" in error_str:
            log_integrity_error("alumni", "register_complete_alumni", ErrorCode.DUPLICATE_ALUMNI_ID.value, "Alumni ID already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_ALUMNI_ID.value,
                    message="Alumni ID already in use"
                ).model_dump(mode='json')
            )
        else:
            log_integrity_error("alumni", "register_complete_alumni", ErrorCode.REGISTRATION_FAILED.value, "Registration failed", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.REGISTRATION_FAILED.value,
                    message="Registration failed"
                ).model_dump(mode='json')
            )
    except Exception as e:
        session.rollback()
        log_error("alumni", "register_complete_alumni", ErrorCode.REGISTRATION_FAILED.value, f"Unexpected error during registration: {str(e)}", e)
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.REGISTRATION_FAILED.value,
                message="Registration failed"
            ).model_dump(mode='json')
        )


@router.post("/batch/register")
def batch_register_alumni(
    batch_data: BatchAlumniRegister,
    session: Session = Depends(get_session)
):
    """Batch create alumni profiles (creates both User and Alumni for each item)"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, alumni_item in enumerate(batch_data.items):
        try:
            with session.begin_nested():
                # Generate user_id based on user_type
                user_type = UserType.USER
                last_user = session.exec(
                    select(User).where(User.user_type == user_type).order_by(User.user_id.desc())
                ).first()
                
                # Auto increment user_id
                if last_user:
                    last_num = int(last_user.user_id.split("-")[1])
                    new_num = last_num + 1
                else:
                    new_num = 1
                
                user_id = f"USER-{new_num:06d}"
                
                # Generate alumni_id
                last_alumni = session.exec(
                    select(Alumni).order_by(Alumni.alumni_id.desc())
                ).first()
                
                # Auto increment alumni_id
                if last_alumni and last_alumni.alumni_id.startswith("ALMN-"):
                    last_alumni_num = int(last_alumni.alumni_id.split("-")[1])
                    new_alumni_num = last_alumni_num + 1
                else:
                    new_alumni_num = 1
                
                alumni_id = f"ALMN-{new_alumni_num:06d}"
                
                # Create User
                new_user = User(
                    user_id=user_id,
                    username=alumni_item.username,
                    email=alumni_item.email,
                    password=hash_password(alumni_item.password),  # Hash the password
                    user_type=UserType.USER
                )
                session.add(new_user)
                session.flush()
                session.refresh(new_user)
                
                # Create Alumni (linked to User)
                new_alumni = Alumni(
                    alumni_id=alumni_id,
                    last_name=alumni_item.last_name,
                    first_name=alumni_item.first_name,
                    middle_name=alumni_item.middle_name,
                    gender=alumni_item.gender,
                    age=alumni_item.age,
                    user_code=new_user.user_code
                )
                session.add(new_alumni)
                session.flush()
                session.refresh(new_alumni)
                
                # Record successful registration
                results.append(BatchAlumniRegistrationResult(
                    index=index,
                    item=BatchAlumniRegistrationItemSafeDisplay(
                        username=alumni_item.username,
                        email=alumni_item.email,
                        last_name=alumni_item.last_name,
                        first_name=alumni_item.first_name,
                        middle_name=alumni_item.middle_name,
                        gender=alumni_item.gender,
                        age=alumni_item.age
                    ),
                    success=True,
                    code=SuccessCode.ALUMNI_CREATED.value,
                    message="Alumni profile created successfully",
                    user_id=user_id,
                    alumni_id=alumni_id
                ))
                successful_count += 1
        
        except IntegrityError as e:
            # session.rollback() is handled automatically by the context manager on error
            error_str = str(e).lower()
            
            if "ix_users_email" in error_str or "users_email_key" in error_str:
                error_code = ErrorCode.DUPLICATE_EMAIL.value
                error_msg = f"Email '{alumni_item.email}' already in use"
            elif "ix_users_username" in error_str or "users_username_key" in error_str:
                error_code = ErrorCode.DUPLICATE_USERNAME.value
                error_msg = f"Username '{alumni_item.username}' already in use"
            else:
                error_code = ErrorCode.REGISTRATION_FAILED.value
                error_msg = "Alumni registration failed due to constraint violation"
            
            results.append(BatchAlumniRegistrationResult(
                index=index,
                item=BatchAlumniRegistrationItemSafeDisplay(
                    username=alumni_item.username,
                    email=alumni_item.email,
                    last_name=alumni_item.last_name,
                    first_name=alumni_item.first_name,
                    middle_name=alumni_item.middle_name,
                    gender=alumni_item.gender,
                    age=alumni_item.age
                ),
                success=False,
                code=error_code,
                message=error_msg,
                user_id=None,
                alumni_id=None
            ))
            failed_count += 1
        
        except ValueError as e:
            error_msg = str(e)
            error_code = ErrorCode.INVALID_INPUT.value
            
            results.append(BatchAlumniRegistrationResult(
                index=index,
                item=BatchAlumniRegistrationItemSafeDisplay(
                    username=alumni_item.username,
                    email=alumni_item.email,
                    last_name=alumni_item.last_name,
                    first_name=alumni_item.first_name,
                    middle_name=alumni_item.middle_name,
                    gender=alumni_item.gender,
                    age=alumni_item.age
                ),
                success=False,
                code=error_code,
                message=error_msg,
                user_id=None,
                alumni_id=None
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
                code=ErrorCode.REGISTRATION_FAILED.value,
                message="Batch registration operation failed during commit"
            ).model_dump(mode='json')
        )
    
    batch_response = BatchAlumniRegisterResponse(
        total_items=len(batch_data.items),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.ALUMNI_BATCH_REGISTERED.value,
        message=f"Batch registration completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.get("")
def get_all_alumni(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by first name, last name, email, or username"),
    gender: str = Query(None, description="Filter by gender (M, F, Other)"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    sort_by: str = Query("alumni_id", description="Sort by field (alumni_id, first_name, last_name, created_at)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all alumni records with filtering, searching, and sorting"""
    # Build query
    query = select(Alumni) if include_deleted else select(Alumni).where(Alumni.is_deleted == False)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        # Search in alumni fields and related user email/username
        alumni_search = (
            (Alumni.first_name.ilike(search_like)) | 
            (Alumni.last_name.ilike(search_like))
        )
        query = query.where(alumni_search)
    
    # Apply gender filter
    if gender:
        query = query.where(Alumni.gender == gender.upper())
    
    # Get total count after filters
    count_query = select(func.count(Alumni.alumni_code)) if include_deleted else select(func.count(Alumni.alumni_code)).where(Alumni.is_deleted == False)
    total = session.exec(count_query).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "first_name":
        query = query.order_by(Alumni.first_name.desc() if sort_order_desc else Alumni.first_name)
    elif sort_by.lower() == "last_name":
        query = query.order_by(Alumni.last_name.desc() if sort_order_desc else Alumni.last_name)
    elif sort_by.lower() == "created_at":
        query = query.order_by(Alumni.created_at.desc() if sort_order_desc else Alumni.created_at)
    else:  # default to alumni_id
        query = query.order_by(Alumni.alumni_id.desc() if sort_order_desc else Alumni.alumni_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    alumni_list = session.exec(query).all()
    
    result = []
    for alumni in alumni_list:
        # Get related student record (optional)
        student = None
        course = None
        if alumni.student_code:
            student = session.exec(
                select(StudentRecord).where(StudentRecord.student_code == alumni.student_code)
            ).first()
            
            # Get related course (only if student exists)
            if student:
                course = session.exec(
                    select(Course).where(Course.course_code == student.course_code)
                ).first()
        
        # Get related user (if exists)
        user = None
        if alumni.user_code:
            user = session.exec(
                select(User).where(User.user_code == alumni.user_code)
            ).first()
        
        # Build full profile
        profile = AlumniFullProfile(
            alumni_id=alumni.alumni_id,
            last_name=alumni.last_name,
            first_name=alumni.first_name,
            middle_name=alumni.middle_name,
            gender=alumni.gender,
            age=alumni.age,
            user_id=user.user_id if user else None,
            username=user.username if user else None,
            email=user.email if user else None,
            student_id=student.student_id if student else None,
            year_graduated=student.year_graduated if student else None,
            gwa=student.gwa if student else None,
            avg_prof_grade=student.avg_prof_grade if student else None,
            avg_elec_grade=student.avg_elec_grade if student else None,
            ojt_grade=student.ojt_grade if student else None,
            leadership_pos=student.leadership_pos if student else None,
            act_member_pos=student.act_member_pos if student else None,
            course_id=course.course_id if course else None,
            course_name=course.course_name if course else None,
            created_at=alumni.created_at,
            updated_at=alumni.updated_at
        )
        result.append(profile)
    
    # Calculate pagination metadata
    returned = len(result)
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
        code=SuccessCode.ALUMNI_LIST_RETRIEVED.value,
        message=f"Retrieved {returned} alumni",
        data={"alumni": result, "pagination": pagination}
    )


@router.get("/{alumni_id}")
def get_alumni(alumni_id: str, session: Session = Depends(get_session)):
    """Get specific alumni by alumni_id with full profile"""
    alumni = session.exec(
        select(Alumni).where((Alumni.alumni_id == alumni_id.upper()) & (Alumni.is_deleted == False))
    ).first()
    
    if not alumni:
        log_error("alumni", "get_alumni", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {alumni_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="Alumni not found"
            ).model_dump(mode='json')
        )
    
    # Get related student record (optional)
    student = None
    course = None
    if alumni.student_code:
        student = session.exec(
            select(StudentRecord).where(StudentRecord.student_code == alumni.student_code)
        ).first()
        
        # Get related course (only if student exists)
        if student:
            course = session.exec(
                select(Course).where(Course.course_code == student.course_code)
            ).first()
    
    # Get related user (if exists)
    user = None
    if alumni.user_code:
        user = session.exec(
            select(User).where(User.user_code == alumni.user_code)
        ).first()
    
    # Build full profile
    profile = AlumniFullProfile(
        alumni_id=alumni.alumni_id,
        last_name=alumni.last_name,
        first_name=alumni.first_name,
        middle_name=alumni.middle_name,
        gender=alumni.gender,
        age=alumni.age,
        user_id=user.user_id if user else None,
        username=user.username if user else None,
        email=user.email if user else None,
        student_id=student.student_id if student else None,
        year_graduated=student.year_graduated if student else None,
        gwa=student.gwa if student else None,
        avg_prof_grade=student.avg_prof_grade if student else None,
        avg_elec_grade=student.avg_elec_grade if student else None,
        ojt_grade=student.ojt_grade if student else None,
        leadership_pos=student.leadership_pos if student else None,
        act_member_pos=student.act_member_pos if student else None,
        course_id=course.course_id if course else None,
        course_name=course.course_name if course else None,
        created_at=alumni.created_at,
        updated_at=alumni.updated_at
    )
    
    return StandardResponse(
        success=True,
        code=SuccessCode.ALUMNI_RETRIEVED.value,
        message=f"Alumni {alumni_id} retrieved successfully",
        data=profile
    )


@router.patch("/batch")
def batch_update_alumni(
    batch_data: BatchAlumniUpdate,
    session: Session = Depends(get_session)
):
    """Batch update alumni records"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, update_item in enumerate(batch_data.items):
        try:
            with session.begin_nested():
                # Find the alumni
                alumni = session.exec(
                    select(Alumni).where(Alumni.alumni_id == update_item.alumni_id.upper())
                ).first()
                
                if not alumni:
                    results.append(BatchAlumniUpdateResult(
                        index=index,
                        alumni_id=update_item.alumni_id,
                        success=False,
                        code=ErrorCode.ALUMNI_NOT_FOUND.value,
                        message=f"Alumni {update_item.alumni_id} not found",
                        data=None
                    ))
                    failed_count += 1
                    continue
                
                # Update only provided fields
                if update_item.last_name is not None:
                    alumni.last_name = update_item.last_name
                if update_item.first_name is not None:
                    alumni.first_name = update_item.first_name
                if update_item.middle_name is not None:
                    alumni.middle_name = update_item.middle_name
                if update_item.gender is not None:
                    alumni.gender = update_item.gender.upper()
                if update_item.age is not None:
                    alumni.age = update_item.age
                
                session.add(alumni)
                session.flush()
                session.refresh(alumni)
                
                # Fetch full profile for response
                student = None
                course = None
                if alumni.student_code:
                    student = session.exec(
                        select(StudentRecord).where(StudentRecord.student_code == alumni.student_code)
                    ).first()
                    
                    if student:
                        course = session.exec(
                            select(Course).where(Course.course_code == student.course_code)
                        ).first()
                
                user = None
                if alumni.user_code:
                    user = session.exec(
                        select(User).where(User.user_code == alumni.user_code)
                    ).first()
                
                profile = AlumniFullProfile(
                    alumni_id=alumni.alumni_id,
                    last_name=alumni.last_name,
                    first_name=alumni.first_name,
                    middle_name=alumni.middle_name,
                    gender=alumni.gender,
                    age=alumni.age,
                    user_id=user.user_id if user else None,
                    username=user.username if user else None,
                    email=user.email if user else None,
                    student_id=student.student_id if student else None,
                    year_graduated=student.year_graduated if student else None,
                    gwa=student.gwa if student else None,
                    avg_prof_grade=student.avg_prof_grade if student else None,
                    avg_elec_grade=student.avg_elec_grade if student else None,
                    ojt_grade=student.ojt_grade if student else None,
                    leadership_pos=student.leadership_pos if student else None,
                    act_member_pos=student.act_member_pos if student else None,
                    course_id=course.course_id if course else None,
                    course_name=course.course_name if course else None,
                    created_at=alumni.created_at,
                    updated_at=alumni.updated_at
                )
                
                # Record successful update
                results.append(BatchAlumniUpdateResult(
                    index=index,
                    alumni_id=update_item.alumni_id,
                    success=True,
                    code=SuccessCode.ALUMNI_UPDATED.value,
                    message="Alumni updated successfully",
                    data=profile.model_dump() if profile else None
                ))
                successful_count += 1
        
        except IntegrityError as e:
            # session.rollback() is handled automatically by the context manager on error
            results.append(BatchAlumniUpdateResult(
                index=index,
                alumni_id=update_item.alumni_id,
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Alumni update failed due to constraint violation",
                data=None
            ))
            failed_count += 1
        
        except ValueError as e:
            error_msg = str(e)
            results.append(BatchAlumniUpdateResult(
                index=index,
                alumni_id=update_item.alumni_id,
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
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
    
    batch_response = BatchAlumniUpdateResponse(
        total_items=len(batch_data.items),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.ALUMNI_BATCH_UPDATED.value,
        message=f"Batch update completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.patch("/{alumni_id}")
def update_alumni(
    alumni_id: str,
    alumni_data: AlumniUpdate,
    session: Session = Depends(get_session)
):
    """Update alumni information"""
    alumni = session.exec(
        select(Alumni).where(Alumni.alumni_id == alumni_id.upper())
    ).first()
    
    if not alumni:
        log_error("alumni", "update_alumni", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {alumni_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="Alumni not found"
            ).model_dump(mode='json')
        )
    
    # Update only provided fields
    if alumni_data.last_name is not None:
        alumni.last_name = alumni_data.last_name
    if alumni_data.first_name is not None:
        alumni.first_name = alumni_data.first_name
    if alumni_data.middle_name is not None:
        alumni.middle_name = alumni_data.middle_name
    if alumni_data.gender is not None:
        alumni.gender = alumni_data.gender.upper()
    if alumni_data.age is not None:
        alumni.age = alumni_data.age
    
    session.add(alumni)
    
    try:
        session.commit()
        session.refresh(alumni)
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("alumni", "update_alumni", ErrorCode.INVALID_INPUT.value, "Update failed", str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Update failed: Invalid input or duplicate entry"
            ).model_dump(mode='json')
        )
    
    # Fetch full profile for response
    student = None
    course = None
    if alumni.student_code:
        student = session.exec(
            select(StudentRecord).where(StudentRecord.student_code == alumni.student_code)
        ).first()
        
        if student:
            course = session.exec(
                select(Course).where(Course.course_code == student.course_code)
            ).first()
    
    user = None
    if alumni.user_code:
        user = session.exec(
            select(User).where(User.user_code == alumni.user_code)
        ).first()
    
    profile = AlumniFullProfile(
        alumni_id=alumni.alumni_id,
        last_name=alumni.last_name,
        first_name=alumni.first_name,
        middle_name=alumni.middle_name,
        gender=alumni.gender,
        age=alumni.age,
        user_id=user.user_id if user else None,
        username=user.username if user else None,
        email=user.email if user else None,
        student_id=student.student_id if student else None,
        year_graduated=student.year_graduated if student else None,
        gwa=student.gwa if student else None,
        avg_prof_grade=student.avg_prof_grade if student else None,
        avg_elec_grade=student.avg_elec_grade if student else None,
        ojt_grade=student.ojt_grade if student else None,
        leadership_pos=student.leadership_pos if student else None,
        act_member_pos=student.act_member_pos if student else None,
        course_id=course.course_id if course else None,
        course_name=course.course_name if course else None,
        created_at=alumni.created_at,
        updated_at=alumni.updated_at
    )
    
    return StandardResponse(
        success=True,
        code=SuccessCode.ALUMNI_UPDATED.value,
        message=f"Alumni {alumni_id} updated successfully",
        data=profile
    )


@router.delete("/batch")
def batch_delete_alumni(
    batch_data: BatchAlumniDelete,
    session: Session = Depends(get_session)
):
    """Batch delete alumni records"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, alumni_id in enumerate(batch_data.ids):
        try:
            # Find the alumni
            alumni = session.exec(
                select(Alumni).where(Alumni.alumni_id == alumni_id.upper())
            ).first()
            
            if not alumni:
                results.append(BatchAlumniDeleteResult(
                    index=index,
                    alumni_id=alumni_id,
                    success=False,
                    code=ErrorCode.ALUMNI_NOT_FOUND.value,
                    message=f"Alumni {alumni_id} not found"
                ))
                failed_count += 1
                continue
            
            # Check if already deleted
            if alumni.is_deleted:
                results.append(BatchAlumniDeleteResult(
                    index=index,
                    alumni_id=alumni_id,
                    success=False,
                    code=ErrorCode.ALREADY_DELETED.value,
                    message="Alumni is already deleted, cannot delete again"
                ))
                failed_count += 1
                continue
            
            # Cascade soft delete to associated student records
            student_records = session.exec(
                select(StudentRecord).where(StudentRecord.alumni_code == alumni.alumni_code)
            ).all()
            for student in student_records:
                if not student.is_deleted:
                    student.is_deleted = True
                    student.deleted_at = get_current_time_gmt8()
                    session.add(student)
            
            # Soft delete the alumni
            alumni.is_deleted = True
            alumni.deleted_at = get_current_time_gmt8()
            session.add(alumni)
            session.flush()
            
            # Record successful deletion
            results.append(BatchAlumniDeleteResult(
                index=index,
                alumni_id=alumni_id,
                success=True,
                code=SuccessCode.ALUMNI_DELETED.value,
                message="Alumni deleted successfully"
            ))
            successful_count += 1
        
        except IntegrityError as e:
            session.rollback()
            results.append(BatchAlumniDeleteResult(
                index=index,
                alumni_id=alumni_id,
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Alumni deletion failed due to constraint violation"
            ))
            failed_count += 1
        
        except ValueError as e:
            error_msg = str(e)
            results.append(BatchAlumniDeleteResult(
                index=index,
                alumni_id=alumni_id,
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
    
    batch_response = BatchAlumniDeleteResponse(
        total_items=len(batch_data.ids),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.ALUMNI_BATCH_DELETED.value,
        message=f"Batch delete completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.delete("/{alumni_id}")
def delete_alumni(alumni_id: str, session: Session = Depends(get_session)):
    """Delete an alumni record"""
    alumni = session.exec(
        select(Alumni).where(Alumni.alumni_id == alumni_id.upper())
    ).first()
    
    if not alumni:
        log_error("alumni", "delete_alumni", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {alumni_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="Alumni not found"
            ).model_dump(mode='json')
        )
    
    if alumni.is_deleted:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALREADY_DELETED.value,
                message="Alumni is already deleted, cannot delete again"
            ).model_dump(mode='json')
        )
    
    try:
        # Cascade soft delete to associated student records
        student_records = session.exec(
            select(StudentRecord).where(StudentRecord.alumni_code == alumni.alumni_code)
        ).all()
        for student in student_records:
            if not student.is_deleted:
                student.is_deleted = True
                student.deleted_at = get_current_time_gmt8()
                session.add(student)
        
        # Soft delete the alumni
        alumni.is_deleted = True
        alumni.deleted_at = get_current_time_gmt8()
        session.add(alumni)
        session.commit()
        return StandardResponse(
            success=True,
            code=SuccessCode.ALUMNI_DELETED.value,
            message=f"Alumni {alumni_id} deleted successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("alumni", "delete_alumni", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Delete failed: Constraint violation or invalid operation"
            ).model_dump(mode='json')
        )


@router.post("/batch/restore")
def batch_restore_alumni(
    data: BatchAlumniRestore,
    session: Session = Depends(get_session)
):
    """Restore multiple soft-deleted alumni"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, alumni_id in enumerate(data.ids):
        try:
            alumni = session.exec(
                select(Alumni).where(Alumni.alumni_id == alumni_id.upper())
            ).first()
            
            if not alumni:
                results.append(BatchAlumniRestoreResult(
                    index=index,
                    alumni_id=alumni_id,
                    success=False,
                    code=ErrorCode.ALUMNI_NOT_FOUND.value,
                    message=f"Alumni '{alumni_id}' not found"
                ))
                failed_count += 1
                continue
            
            if not alumni.is_deleted:
                results.append(BatchAlumniRestoreResult(
                    index=index,
                    alumni_id=alumni_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"Alumni '{alumni_id}' is not deleted"
                ))
                failed_count += 1
                continue
            
            # Cascade restore associated student records
            student_records = session.exec(
                select(StudentRecord).where((StudentRecord.alumni_code == alumni.alumni_code) & (StudentRecord.is_deleted == True))
            ).all()
            for student in student_records:
                student.is_deleted = False
                student.deleted_at = None
                session.add(student)
            
            # Restore alumni
            alumni.is_deleted = False
            alumni.deleted_at = None
            session.add(alumni)
            session.flush()
            
            # Record successful restoration
            results.append(BatchAlumniRestoreResult(
                index=index,
                alumni_id=alumni_id,
                success=True,
                code=SuccessCode.ALUMNI_RESTORED.value,
                message="Alumni restored successfully"
            ))
            successful_count += 1
        
        except IntegrityError as e:
            session.rollback()
            error_code = ErrorCode.INVALID_INPUT.value
            error_msg = "Restore failed: Constraint violation or related data issue"
            results.append(BatchAlumniRestoreResult(
                index=index,
                alumni_id=alumni_id,
                success=False,
                code=error_code,
                message=error_msg
            ))
            log_integrity_error("alumni", "batch_restore_alumni", error_code, error_msg, str(e))
            failed_count += 1
    
    session.commit()
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.ALUMNI_BATCH_RESTORED.value,
        message=f"Restore operation completed: {successful_count} succeeded, {failed_count} failed",
        data=BatchAlumniRestoreResponse(
            total_items=len(data.ids),
            successful=successful_count,
            failed=failed_count,
            results=results
        )
    )


@router.post("/{alumni_id}/restore")
def restore_alumni(alumni_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted alumni record"""
    alumni = session.exec(
        select(Alumni).where(Alumni.alumni_id == alumni_id.upper())
    ).first()
    
    if not alumni:
        log_error("alumni", "restore_alumni", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {alumni_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="Alumni not found"
            ).model_dump(mode='json')
        )
    
    if not alumni.is_deleted:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Alumni is not deleted, cannot restore"
            ).model_dump(mode='json')
        )
    
    try:
        # Cascade restore associated student records
        student_records = session.exec(
            select(StudentRecord).where((StudentRecord.alumni_code == alumni.alumni_code) & (StudentRecord.is_deleted == True))
        ).all()
        for student in student_records:
            student.is_deleted = False
            student.deleted_at = None
            session.add(student)
        
        # Restore soft-deleted alumni
        alumni.is_deleted = False
        alumni.deleted_at = None
        session.add(alumni)
        session.commit()
        return StandardResponse(
            success=True,
            code=SuccessCode.ALUMNI_RESTORED.value,
            message=f"Alumni {alumni_id} restored successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("alumni", "restore_alumni", ErrorCode.INVALID_INPUT.value, "Restore failed", str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Restore failed: Constraint violation or invalid operation"
            ).model_dump(mode='json')
        )


@router.get("/deleted/list")
def get_deleted_alumni(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by first name or last name"),
    sort_by: str = Query("deleted_at", description="Sort by field (alumni_id, first_name, last_name, deleted_at)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all soft-deleted alumni (admin endpoint)"""
    # Build query - only show deleted records
    query = select(Alumni).where(Alumni.is_deleted == True)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(
            (Alumni.first_name.ilike(search_like)) | (Alumni.last_name.ilike(search_like))
        )
    
    # Get total count
    total = session.exec(select(func.count(Alumni.alumni_code)).where(Alumni.is_deleted == True)).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "first_name":
        query = query.order_by(Alumni.first_name.desc() if sort_order_desc else Alumni.first_name)
    elif sort_by.lower() == "last_name":
        query = query.order_by(Alumni.last_name.desc() if sort_order_desc else Alumni.last_name)
    elif sort_by.lower() == "deleted_at":
        query = query.order_by(Alumni.deleted_at.desc() if sort_order_desc else Alumni.deleted_at)
    else:  # default to alumni_id
        query = query.order_by(Alumni.alumni_id.desc() if sort_order_desc else Alumni.alumni_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    alumni_list = session.exec(query).all()
    public_alumni = [AlumniPublic.model_validate(alumni) for alumni in alumni_list]
    
    # Calculate pagination metadata
    returned = len(alumni_list)
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
        code=SuccessCode.ALUMNI_LIST_RETRIEVED.value,
        message=f"Retrieved {returned} deleted alumni",
        data=public_alumni,
        pagination=pagination
    )


@router.get("/all/list")
def get_all_alumni_including_deleted(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by first name, last name, email, or username"),
    gender: str = Query(None, description="Filter by gender (M, F, Other)"),
    sort_by: str = Query("alumni_id", description="Sort by field (alumni_id, first_name, last_name, created_at)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all alumni including soft-deleted (admin endpoint)"""
    # Build query - include all records
    query = select(Alumni)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(
            (Alumni.first_name.ilike(search_like)) | (Alumni.last_name.ilike(search_like))
        )
    
    # Apply gender filter
    if gender:
        query = query.where(Alumni.gender == gender.upper())
    
    # Get total count
    total = session.exec(select(func.count(Alumni.alumni_code))).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "first_name":
        query = query.order_by(Alumni.first_name.desc() if sort_order_desc else Alumni.first_name)
    elif sort_by.lower() == "last_name":
        query = query.order_by(Alumni.last_name.desc() if sort_order_desc else Alumni.last_name)
    elif sort_by.lower() == "created_at":
        query = query.order_by(Alumni.created_at.desc() if sort_order_desc else Alumni.created_at)
    else:  # default to alumni_id
        query = query.order_by(Alumni.alumni_id.desc() if sort_order_desc else Alumni.alumni_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    alumni_list = session.exec(query).all()
    public_alumni = [AlumniPublic.model_validate(alumni) for alumni in alumni_list]
    
    # Calculate pagination metadata
    returned = len(alumni_list)
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
        code=SuccessCode.ALUMNI_LIST_RETRIEVED.value,
        message=f"Retrieved {returned} alumni (including deleted)",
        data=public_alumni,
        pagination=pagination
    )
