from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from models.courses import (
    Course, CourseCreate, CourseUpdate, CoursePublic,
    CourseBatchCreate, CourseBatchCreateResponse, CourseBatchCreateItem,
    CourseBatchUpdate, CourseBatchUpdateResponse, CourseBatchUpdateResult,
    CourseBatchDelete, CourseBatchDeleteResponse, CourseBatchDeleteResult,
    CourseBatchRestore, CourseBatchRestoreResponse, CourseBatchRestoreResult
)
from models.college_dept import CollegeDept
from models.student_records import StudentRecord
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from models.pagination import PaginatedResponse, PaginationMetadata
from utils.logging import log_error, log_integrity_error
from utils.timezone import get_current_time_gmt8

router = APIRouter(prefix="/courses", tags=["courses"])


def generate_course_id(session: Session) -> str:
    """Generate course_id with auto-increment"""
    last_course = session.exec(
        select(Course).order_by(Course.course_id.desc())
    ).first()
    
    if last_course and last_course.course_id.startswith("CRS-"):
        last_num = int(last_course.course_id.split("-")[1])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"CRS-{new_num:06d}"  # Format: CRS-000001


@router.post("/batch")
def batch_create_courses(
    batch_data: CourseBatchCreate,
    session: Session = Depends(get_session)
):
    """Batch create courses"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, course_item in enumerate(batch_data.items):
        try:
            with session.begin_nested():
                # Verify college department exists and get its code
                college_dept = session.exec(
                    select(CollegeDept).where(CollegeDept.college_dept_abbv == course_item.college_dept_abbv.upper())
                ).first()
                
                if not college_dept:
                    error_code = ErrorCode.COLLEGE_DEPT_NOT_FOUND.value
                    error_msg = f"College department '{course_item.college_dept_abbv}' not found"
                    
                    results.append(CourseBatchCreateItem(
                        index=index,
                        item=course_item,
                        success=False,
                        code=error_code,
                        message=error_msg,
                        data=None
                    ))
                    failed_count += 1
                    continue
                
                # Generate course_id
                course_id = generate_course_id(session)
                
                # Create course
                course_dict = course_item.model_dump(exclude={"college_dept_abbv"})
                course_dict["course_id"] = course_id
                course_dict["college_dept_code"] = college_dept.college_dept_code
                
                new_course = Course.model_validate(course_dict)
                session.add(new_course)
                session.flush()  # Flush to get the ID but don't commit yet
                session.refresh(new_course)
                
                # Record successful creation
                results.append(CourseBatchCreateItem(
                    index=index,
                    item=course_item,
                    success=True,
                    code=SuccessCode.COURSE_CREATED.value,
                    message="Course created successfully",
                    data=CoursePublic(
                        **new_course.model_dump(exclude={"college_dept_code"}),
                        college_dept_id=college_dept.college_dept_id,
                        college_dept_name=college_dept.college_dept_name
                    )
                ))
                successful_count += 1
        
        except IntegrityError as e:
            # session.rollback() is handled automatically by the context manager on error
            error_str = str(e).lower()
            
            if "ix_courses_course_abbv" in error_str or "courses_course_abbv_key" in error_str:
                error_code = ErrorCode.DUPLICATE_COURSE_ABBV.value
                error_msg = f"Course abbreviation '{course_item.course_abbv}' already exists"
            elif "ix_courses_course_name" in error_str or "courses_course_name_key" in error_str:
                error_code = ErrorCode.DUPLICATE_COURSE_NAME.value
                error_msg = f"Course name '{course_item.course_name}' already exists"
            else:
                error_code = ErrorCode.INVALID_INPUT.value
                error_msg = "Course creation failed due to constraint violation"
            
            results.append(CourseBatchCreateItem(
                index=index,
                item=course_item,
                success=False,
                code=error_code,
                message=error_msg,
                data=None
            ))
            failed_count += 1
        
        except ValueError as e:
            error_msg = str(e)
            error_code = ErrorCode.INVALID_INPUT.value
            
            results.append(CourseBatchCreateItem(
                index=index,
                item=course_item,
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
    
    batch_response = CourseBatchCreateResponse(
        total_items=len(batch_data.items),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,  # True only if all succeeded
        code=SuccessCode.COURSES_BATCH_CREATED.value,
        message=f"Batch create completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.put("/batch")
def batch_update_courses(
    batch_data: CourseBatchUpdate,
    session: Session = Depends(get_session)
):
    """Batch update courses"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, update_item in enumerate(batch_data.items):
        try:
            with session.begin_nested():
                # Find course
                course = session.exec(
                    select(Course).where(Course.course_id == update_item.course_id.upper())
                ).first()
                
                if not course:
                    results.append(CourseBatchUpdateResult(
                        index=index,
                        course_id=update_item.course_id,
                        success=False,
                        code=ErrorCode.COURSE_NOT_FOUND.value,
                        message=f"Course '{update_item.course_id}' not found",
                        data=None
                    ))
                    failed_count += 1
                    continue
                
                # If college_dept_abbv is provided, verify it exists and update
                if update_item.college_dept_abbv is not None:
                    college_dept = session.exec(
                        select(CollegeDept).where(CollegeDept.college_dept_abbv == update_item.college_dept_abbv.upper())
                    ).first()
                    
                    if not college_dept:
                        results.append(CourseBatchUpdateResult(
                            index=index,
                            course_id=update_item.course_id,
                            success=False,
                            code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value,
                            message=f"College department '{update_item.college_dept_abbv}' not found",
                            data=None
                        ))
                        failed_count += 1
                        continue
                    
                    course.college_dept_code = college_dept.college_dept_code
                else:
                    # Get current college dept for response
                    college_dept = session.exec(
                        select(CollegeDept).where(CollegeDept.college_dept_code == course.college_dept_code)
                    ).first()
                
                # Update only provided fields
                if update_item.course_abbv is not None:
                    course.course_abbv = update_item.course_abbv
                if update_item.course_name is not None:
                    course.course_name = update_item.course_name
                if update_item.course_desc is not None:
                    course.course_desc = update_item.course_desc
                
                # Update timestamp
                from datetime import datetime, timezone
                course.updated_at = datetime.now(timezone.utc)
                
                session.add(course)
                session.flush()
                session.refresh(course)
                
                # Record successful update
                results.append(CourseBatchUpdateResult(
                    index=index,
                    course_id=update_item.course_id,
                    success=True,
                    code=SuccessCode.COURSE_UPDATED.value,
                    message="Course updated successfully",
                    data=CoursePublic(
                        **course.model_dump(exclude={"college_dept_code"}),
                        college_dept_id=college_dept.college_dept_id if college_dept else "UNKNOWN",
                        college_dept_name=college_dept.college_dept_name if college_dept else "Unknown Department"
                    )
                ))
                successful_count += 1
        
        except IntegrityError as e:
            # session.rollback() is handled automatically by the context manager on error
            error_str = str(e).lower()
            
            if "ix_courses_course_abbv" in error_str or "courses_course_abbv_key" in error_str:
                error_code = ErrorCode.DUPLICATE_COURSE_ABBV.value
                error_msg = f"Course abbreviation already in use"
            elif "ix_courses_course_name" in error_str or "courses_course_name_key" in error_str:
                error_code = ErrorCode.DUPLICATE_COURSE_NAME.value
                error_msg = f"Course name already in use"
            else:
                error_code = ErrorCode.INVALID_INPUT.value
                error_msg = "Update failed due to constraint violation"
            
            results.append(CourseBatchUpdateResult(
                index=index,
                course_id=update_item.course_id,
                success=False,
                code=error_code,
                message=error_msg,
                data=None
            ))
            failed_count += 1
        
        except ValueError as e:
            error_msg = str(e)
            error_code = ErrorCode.INVALID_INPUT.value
            
            results.append(CourseBatchUpdateResult(
                index=index,
                course_id=update_item.course_id,
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
    
    batch_response = CourseBatchUpdateResponse(
        total_items=len(batch_data.items),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.COURSES_BATCH_UPDATED.value,
        message=f"Batch update completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.delete("/batch")
def batch_delete_courses(
    batch_data: CourseBatchDelete,
    session: Session = Depends(get_session)
):
    """Batch delete courses"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, course_id in enumerate(batch_data.ids):
        try:
            # Find course
            course = session.exec(
                select(Course).where(Course.course_id == course_id.upper())
            ).first()
            
            if not course:
                results.append(CourseBatchDeleteResult(
                    index=index,
                    course_id=course_id,
                    success=False,
                    code=ErrorCode.COURSE_NOT_FOUND.value,
                    message=f"Course '{course_id}' not found"
                ))
                failed_count += 1
                continue
            
            # Check if already deleted
            if course.is_deleted:
                results.append(CourseBatchDeleteResult(
                    index=index,
                    course_id=course_id,
                    success=False,
                    code=ErrorCode.ALREADY_DELETED.value,
                    message="Course is already deleted, cannot delete again"
                ))
                failed_count += 1
                continue
            
            # Check if course has active student records referencing it
            active_students = session.exec(
                select(StudentRecord).where((StudentRecord.course_code == course.course_code) & (StudentRecord.is_deleted == False))
            ).first()
            if active_students:
                results.append(CourseBatchDeleteResult(
                    index=index,
                    course_id=course_id,
                    success=False,
                    code=ErrorCode.CANNOT_DELETE_COURSE_WITH_ACTIVE_STUDENT_RECORDS.value,
                    message="Cannot delete course with active student records"
                ))
                failed_count += 1
                continue
            
            # Delete course
            # Soft delete
            course.is_deleted = True
            course.deleted_at = get_current_time_gmt8()
            session.add(course)
            session.flush()
            
            # Record successful deletion
            results.append(CourseBatchDeleteResult(
                index=index,
                course_id=course_id,
                success=True,
                code=SuccessCode.COURSE_DELETED.value,
                message="Course deleted successfully"
            ))
            successful_count += 1
        
        except IntegrityError as e:
            session.rollback()
            error_code = ErrorCode.INVALID_INPUT.value
            error_msg = "Delete failed: Constraint violation or related data exists"
            
            results.append(CourseBatchDeleteResult(
                index=index,
                course_id=course_id,
                success=False,
                code=error_code,
                message=error_msg
            ))
            failed_count += 1
        
        except Exception as e:
            session.rollback()
            error_code = ErrorCode.INVALID_INPUT.value
            error_msg = f"Delete failed: {str(e)}"
            
            results.append(CourseBatchDeleteResult(
                index=index,
                course_id=course_id,
                success=False,
                code=error_code,
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
    
    batch_response = CourseBatchDeleteResponse(
        total_items=len(batch_data.ids),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.COURSES_BATCH_DELETED.value,
        message=f"Batch delete completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.post("")
def create_course(
    course_data: CourseCreate,
    session: Session = Depends(get_session)
):
    """Create a new course"""
    # Verify college department exists and get its code
    college_dept = session.exec(
        select(CollegeDept).where(CollegeDept.college_dept_abbv == course_data.college_dept_abbv.upper())
    ).first()
    
    if not college_dept:
        log_error("courses", "create_course", ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, f"College department {course_data.college_dept_abbv} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value,
                message="College department not found"
            ).model_dump(mode='json')
        )
    
    # Generate course_id
    course_id = generate_course_id(session)
    
    # Create course
    course_dict = course_data.model_dump(exclude={"college_dept_abbv"})
    course_dict["course_id"] = course_id
    course_dict["college_dept_code"] = college_dept.college_dept_code
    
    new_course = Course.model_validate(course_dict)
    session.add(new_course)
    
    try:
        session.commit()
        session.refresh(new_course)
        
        # Build response with college dept info
        return StandardResponse(
            success=True,
            code=SuccessCode.COURSE_CREATED.value,
            message="Course created successfully",
            data=CoursePublic(
                **new_course.model_dump(exclude={"college_dept_code"}),
                college_dept_id=college_dept.college_dept_id,
                college_dept_name=college_dept.college_dept_name
            )
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_courses_course_id" in error_str or "courses_course_id_key" in error_str:
            log_integrity_error("courses", "create_course", ErrorCode.DUPLICATE_COURSE_ID.value, "Course ID already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_COURSE_ID.value,
                    message="Course ID already in use"
                ).model_dump(mode='json')
            )
        elif "ix_courses_course_abbv" in error_str or "courses_course_abbv_key" in error_str:
            log_integrity_error("courses", "create_course", ErrorCode.DUPLICATE_COURSE_ABBV.value, "Course abbreviation already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_COURSE_ABBV.value,
                    message="Course abbreviation already in use"
                ).model_dump(mode='json')
            )
        elif "ix_courses_course_name" in error_str or "courses_course_name_key" in error_str:
            log_integrity_error("courses", "create_course", ErrorCode.DUPLICATE_COURSE_NAME.value, "Course name already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_COURSE_NAME.value,
                    message="Course name already in use"
                ).model_dump(mode='json')
            )
        else:
            log_integrity_error("courses", "create_course", ErrorCode.INVALID_INPUT.value, "Course creation failed", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Course with these details already exists"
                ).model_dump(mode='json')
            )


@router.get("")
def get_all_courses(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by course abbreviation or name"),
    college_dept_abbv: str = Query(None, description="Filter by college department abbreviation"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    sort_by: str = Query("course_id", description="Sort by field (course_id, course_abbv, course_name)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):  
    """Get all courses with filtering, searching, and sorting"""
    # Build query
    query = select(Course) if include_deleted else select(Course).where(Course.is_deleted == False)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(
            (Course.course_abbv.ilike(search_like)) | 
            (Course.course_name.ilike(search_like)) |
            (Course.course_desc.ilike(search_like))
        )
    
    # Apply college_dept filter
    if college_dept_abbv:
        college_dept = session.exec(
            select(CollegeDept).where(CollegeDept.college_dept_abbv == college_dept_abbv.upper())
        ).first()
        if college_dept:
            query = query.where(Course.college_dept_code == college_dept.college_dept_code)
    
    # Get total count after filters
    count_query = select(func.count(Course.course_code)) if include_deleted else select(func.count(Course.course_code)).where(Course.is_deleted == False)
    total = session.exec(count_query).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "course_abbv":
        query = query.order_by(Course.course_abbv.desc() if sort_order_desc else Course.course_abbv)
    elif sort_by.lower() == "course_name":
        query = query.order_by(Course.course_name.desc() if sort_order_desc else Course.course_name)
    else:  # default to course_id
        query = query.order_by(Course.course_id.desc() if sort_order_desc else Course.course_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    courses = session.exec(query).all()
    
    # Build response with college dept info
    result = []
    for course in courses:
        college_dept = session.exec(
            select(CollegeDept).where(CollegeDept.college_dept_code == course.college_dept_code)
        ).first()
        
        result.append(CoursePublic(
            **course.model_dump(exclude={"college_dept_code"}),
            college_dept_id=college_dept.college_dept_id if college_dept else "UNKNOWN",
            college_dept_name=college_dept.college_dept_name if college_dept else "Unknown Department"
        ))
    
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
        code=SuccessCode.COURSES_RETRIEVED.value,
        message=f"Retrieved {returned} courses",
        data={"courses": result, "pagination": pagination}
    )


@router.get("/{course_id}")
def get_course(course_id: str, session: Session = Depends(get_session)):
    """Get a specific course by course_id"""
    course = session.exec(
        select(Course).where((Course.course_id == course_id.upper()) & (Course.is_deleted == False))
    ).first()
    
    if not course:
        log_error("courses", "get_course", ErrorCode.COURSE_NOT_FOUND.value, f"Course {course_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.COURSE_NOT_FOUND.value,
                message="Course not found"
            ).model_dump(mode='json')
        )
    
    # Get college dept info
    college_dept = session.exec(
        select(CollegeDept).where(CollegeDept.college_dept_code == course.college_dept_code)
    ).first()
    
    return StandardResponse(
        success=True,
        code=SuccessCode.COURSE_RETRIEVED.value,
        message=f"Course {course_id} retrieved successfully",
        data=CoursePublic(
            **course.model_dump(exclude={"college_dept_code"}),
            college_dept_id=college_dept.college_dept_id if college_dept else "UNKNOWN",
            college_dept_name=college_dept.college_dept_name if college_dept else "Unknown Department"
        )
    )


@router.put("/{course_id}")
def update_course(
    course_id: str,
    course_data: CourseUpdate,
    session: Session = Depends(get_session)
):
    """Update course information"""
    course = session.exec(
        select(Course).where(Course.course_id == course_id.upper())
    ).first()
    
    if not course:
        log_error("courses", "update_course", ErrorCode.COURSE_NOT_FOUND.value, f"Course {course_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.COURSE_NOT_FOUND.value,
                message="Course not found"
            ).model_dump(mode='json')
        )
    
    # If college_dept_abbv is provided, verify it exists and update
    if course_data.college_dept_abbv is not None:
        college_dept = session.exec(
            select(CollegeDept).where(CollegeDept.college_dept_abbv == course_data.college_dept_abbv.upper())
        ).first()
        
        if not college_dept:
            log_error("courses", "update_course", ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, f"College department {course_data.college_dept_abbv} not found")
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value,
                    message="College department not found"
                ).model_dump(mode='json')
            )
        
        course.college_dept_code = college_dept.college_dept_code
    
    # Update only provided fields
    if course_data.course_abbv is not None:
        course.course_abbv = course_data.course_abbv
    if course_data.course_name is not None:
        course.course_name = course_data.course_name
    if course_data.course_desc is not None:
        course.course_desc = course_data.course_desc
    
    # Update the updated_at timestamp
    from datetime import datetime, timezone
    course.updated_at = datetime.now(timezone.utc)
    
    session.add(course)
    
    try:
        session.commit()
        session.refresh(course)
        
        # Get college dept info for response
        college_dept = session.exec(
            select(CollegeDept).where(CollegeDept.college_dept_code == course.college_dept_code)
        ).first()
        
        return StandardResponse(
            success=True,
            code=SuccessCode.COURSE_UPDATED.value,
            message="Course updated successfully",
            data=CoursePublic(
                **course.model_dump(exclude={"college_dept_code"}),
                college_dept_id=college_dept.college_dept_id if college_dept else "UNKNOWN",
                college_dept_name=college_dept.college_dept_name if college_dept else "Unknown Department"
            )
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_courses_course_id" in error_str or "courses_course_id_key" in error_str:
            log_integrity_error("courses", "update_course", ErrorCode.DUPLICATE_COURSE_ID.value, "Course ID already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_COURSE_ID.value,
                    message="Course ID already in use"
                ).model_dump(mode='json')
            )
        elif "ix_courses_course_abbv" in error_str or "courses_course_abbv_key" in error_str:
            log_integrity_error("courses", "update_course", ErrorCode.DUPLICATE_COURSE_ABBV.value, "Course abbreviation already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_COURSE_ABBV.value,
                    message="Course abbreviation already in use"
                ).model_dump(mode='json')
            )
        elif "ix_courses_course_name" in error_str or "courses_course_name_key" in error_str:
            log_integrity_error("courses", "update_course", ErrorCode.DUPLICATE_COURSE_NAME.value, "Course name already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_COURSE_NAME.value,
                    message="Course name already in use"
                ).model_dump(mode='json')
            )
        else:
            log_integrity_error("courses", "update_course", ErrorCode.INVALID_INPUT.value, "Update failed", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Update failed: Invalid input or constraint violation"
                ).model_dump(mode='json')
            )


@router.delete("/{course_id}")
def delete_course(course_id: str, session: Session = Depends(get_session)):
    """Delete a course"""
    course = session.exec(
        select(Course).where(Course.course_id == course_id.upper())
    ).first()
    
    if not course:
        log_error("courses", "delete_course", ErrorCode.COURSE_NOT_FOUND.value, f"Course {course_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.COURSE_NOT_FOUND.value,
                message="Course not found"
            ).model_dump(mode='json')
        )
    
    if course.is_deleted:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALREADY_DELETED.value,
                message="Course is already deleted, cannot delete again"
            ).model_dump(mode='json')
        )
    
    # Check if course has active student records referencing it
    active_students = session.exec(
        select(StudentRecord).where((StudentRecord.course_code == course.course_code) & (StudentRecord.is_deleted == False))
    ).first()
    if active_students:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.CANNOT_DELETE_COURSE_WITH_ACTIVE_STUDENT_RECORDS.value,
                message="Cannot delete course with active student records"
            ).model_dump(mode='json')
        )
    
    try:
        # Soft delete
        course.is_deleted = True
        course.deleted_at = get_current_time_gmt8()
        session.add(course)
        session.commit()
        return StandardResponse(
            success=True,
            code=SuccessCode.COURSE_DELETED.value,
            message=f"Course {course_id} deleted successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("courses", "delete_course", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Delete failed: Constraint violation or invalid operation"
            ).model_dump(mode='json')
        )


@router.post("/batch/restore")
def batch_restore_courses(
    data: CourseBatchRestore,
    session: Session = Depends(get_session)
):
    """Restore multiple soft-deleted courses"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, course_id in enumerate(data.ids):
        try:
            course = session.exec(
                select(Course).where(Course.course_id == course_id.upper())
            ).first()
            
            if not course:
                results.append(CourseBatchRestoreResult(
                    index=index,
                    course_id=course_id,
                    success=False,
                    code=ErrorCode.COURSE_NOT_FOUND.value,
                    message=f"Course '{course_id}' not found"
                ))
                failed_count += 1
                continue
            
            if not course.is_deleted:
                results.append(CourseBatchRestoreResult(
                    index=index,
                    course_id=course_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"Course '{course_id}' is not deleted"
                ))
                failed_count += 1
                continue
            
            # Restore course
            course.is_deleted = False
            course.deleted_at = None
            session.add(course)
            session.flush()
            
            # Record successful restoration
            results.append(CourseBatchRestoreResult(
                index=index,
                course_id=course_id,
                success=True,
                code=SuccessCode.COURSE_RESTORED.value,
                message="Course restored successfully"
            ))
            successful_count += 1
        
        except IntegrityError as e:
            session.rollback()
            error_code = ErrorCode.INVALID_INPUT.value
            error_msg = "Restore failed: Constraint violation or related data issue"
            results.append(CourseBatchRestoreResult(
                index=index,
                course_id=course_id,
                success=False,
                code=error_code,
                message=error_msg
            ))
            log_integrity_error("courses", "batch_restore_courses", error_code, error_msg, str(e))
            failed_count += 1
    
    session.commit()
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.COURSES_BATCH_RESTORED.value,
        message=f"Restore operation completed: {successful_count} succeeded, {failed_count} failed",
        data=CourseBatchRestoreResponse(
            total_items=len(data.ids),
            successful=successful_count,
            failed=failed_count,
            results=results
        )
    )


@router.post("/{course_id}/restore")
def restore_course(course_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted course"""
    course = session.exec(
        select(Course).where(Course.course_id == course_id.upper())
    ).first()
    
    if not course:
        log_error("courses", "restore_course", ErrorCode.COURSE_NOT_FOUND.value, f"Course {course_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.COURSE_NOT_FOUND.value,
                message="Course not found"
            ).model_dump(mode='json')
        )
    
    if not course.is_deleted:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Course is not deleted, cannot restore"
            ).model_dump(mode='json')
        )
    
    try:
        # Restore soft-deleted course
        course.is_deleted = False
        course.deleted_at = None
        session.add(course)
        session.commit()
        return StandardResponse(
            success=True,
            code=SuccessCode.COURSE_RESTORED.value,
            message=f"Course {course_id} restored successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("courses", "restore_course", ErrorCode.INVALID_INPUT.value, "Restore failed", str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Restore failed: Constraint violation or invalid operation"
            ).model_dump(mode='json')
        )


@router.get("/deleted/list")
def get_deleted_courses(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by course abbreviation or name"),
    sort_by: str = Query("deleted_at", description="Sort by field (course_id, course_abbv, course_name, deleted_at)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all soft-deleted courses (admin endpoint)"""
    # Build query - only show deleted records
    query = select(Course).where(Course.is_deleted == True)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(
            (Course.course_abbv.ilike(search_like)) | (Course.course_name.ilike(search_like))
        )
    
    # Get total count
    total = session.exec(select(func.count(Course.course_code)).where(Course.is_deleted == True)).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "course_abbv":
        query = query.order_by(Course.course_abbv.desc() if sort_order_desc else Course.course_abbv)
    elif sort_by.lower() == "course_name":
        query = query.order_by(Course.course_name.desc() if sort_order_desc else Course.course_name)
    elif sort_by.lower() == "deleted_at":
        query = query.order_by(Course.deleted_at.desc() if sort_order_desc else Course.deleted_at)
    else:  # default to course_id
        query = query.order_by(Course.course_id.desc() if sort_order_desc else Course.course_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    courses = session.exec(query).all()
    public_courses = [CoursePublic.model_validate(course) for course in courses]
    
    # Calculate pagination metadata
    returned = len(courses)
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
        code=SuccessCode.COURSES_RETRIEVED.value,
        message=f"Retrieved {returned} deleted courses",
        data=public_courses,
        pagination=pagination
    )


@router.get("/all/list")
def get_all_courses_including_deleted(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by course abbreviation or name"),
    college_dept_abbv: str = Query(None, description="Filter by college department abbreviation"),
    sort_by: str = Query("course_id", description="Sort by field (course_id, course_abbv, course_name)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all courses including soft-deleted (admin endpoint)"""
    # Build query - include all records
    query = select(Course)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(
            (Course.course_abbv.ilike(search_like)) | (Course.course_name.ilike(search_like))
        )
    
    # Apply college_dept filter
    if college_dept_abbv:
        college_dept = session.exec(
            select(CollegeDept).where(CollegeDept.college_dept_abbv == college_dept_abbv.upper())
        ).first()
        if college_dept:
            query = query.where(Course.college_dept_code == college_dept.college_dept_code)
    
    # Get total count
    total = session.exec(select(func.count(Course.course_code))).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "course_abbv":
        query = query.order_by(Course.course_abbv.desc() if sort_order_desc else Course.course_abbv)
    elif sort_by.lower() == "course_name":
        query = query.order_by(Course.course_name.desc() if sort_order_desc else Course.course_name)
    else:  # default to course_id
        query = query.order_by(Course.course_id.desc() if sort_order_desc else Course.course_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    courses = session.exec(query).all()
    public_courses = [CoursePublic.model_validate(course) for course in courses]
    
    # Calculate pagination metadata
    returned = len(courses)
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
        code=SuccessCode.COURSES_RETRIEVED.value,
        message=f"Retrieved {returned} courses (including deleted)",
        data=public_courses,
        pagination=pagination
    )
