from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from models.student_records import (
    StudentRecord, StudentRecordCreate, StudentRecordUpdate, StudentRecordPublic,
    StudentRecordCreateSafeDisplay, StudentRecordUpdateSafeDisplay,
    StudentRecordBatchCreate, StudentRecordBatchCreateItem, StudentRecordBatchCreateResponse,
    StudentRecordBatchUpdate, StudentRecordBatchUpdateItem, StudentRecordBatchUpdateResult, StudentRecordBatchUpdateResponse,
    StudentRecordBatchDelete, StudentRecordBatchDeleteResult, StudentRecordBatchDeleteResponse,
    StudentRecordBatchRestore, StudentRecordBatchRestoreResult, StudentRecordBatchRestoreResponse
)
from models.courses import Course
from models.alumni import Alumni
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from models.pagination import PaginatedResponse, PaginationMetadata
from utils.logging import log_error, log_integrity_error
from utils.timezone import get_current_time_gmt8

router = APIRouter(prefix="/student-records", tags=["student-records"])


@router.post("")
def create_student_record(
    student_data: StudentRecordCreate,
    session: Session = Depends(get_session)
):
    """Create a new student record linked to an alumni"""
    # Verify course exists
    course = session.exec(
        select(Course).where(Course.course_abbv == student_data.course_abbv.upper())
    ).first()
    
    if not course:
        log_error("student_records", "create_student_record", ErrorCode.DEGREE_NOT_FOUND.value, f"Course {student_data.course_abbv} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.DEGREE_NOT_FOUND.value,
                message="Course not found"
            ).model_dump(mode='json')
        )
    
    # Verify alumni exists
    alumni = session.exec(
        select(Alumni).where(Alumni.alumni_id == student_data.alumni_id)
    ).first()
    
    if not alumni:
        log_error("student_records", "create_student_record", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {student_data.alumni_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="Alumni not found"
            ).model_dump(mode='json')
        )
    
    # Convert Pydantic model to dict and extract non-StudentRecord fields
    student_dict = student_data.model_dump(exclude={"alumni_id", "course_abbv"})
    student_dict["course_code"] = course.course_code
    student_dict["alumni_code"] = alumni.alumni_code
    
    new_student = StudentRecord.model_validate(student_dict)
    session.add(new_student)
    
    # Update alumni's student_code reference for backwards compatibility
    alumni.student_code = None  # Will be set after flush
    session.add(alumni)
    
    try:
        session.flush()  # Get student_code
        alumni.student_code = new_student.student_code
        session.commit()
        session.refresh(new_student)
        return StandardResponse(
            success=True,
            code=SuccessCode.STUDENT_RECORD_CREATED.value,
            message="Student record created successfully",
            data=StudentRecordPublic.model_validate(new_student)
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_student_records_student_id" in error_str or "student_records_student_id_key" in error_str:
            log_integrity_error("student_records", "create_student_record", ErrorCode.DUPLICATE_STUDENT_ID.value, "Student ID already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_STUDENT_ID.value,
                    message="Student ID already in use"
                ).model_dump(mode='json')
            )
        elif "student_records_alumni_code_key" in error_str:
            log_integrity_error("student_records", "create_student_record", ErrorCode.ALUMNI_ALREADY_HAS_STUDENT_RECORD.value, "Alumni already has student record", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALUMNI_ALREADY_HAS_STUDENT_RECORD.value,
                    message="This alumni already has a student record"
                ).model_dump(mode='json')
            )
        elif "student_records_course_code_fkey" in error_str or "course_code" in error_str:
            log_integrity_error("student_records", "create_student_record", ErrorCode.DEGREE_NOT_FOUND.value, "Specified course does not exist", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DEGREE_NOT_FOUND.value,
                    message="Specified course does not exist"
                ).model_dump(mode='json')
            )
        elif "student_records_alumni_code_fkey" in error_str or "alumni_code" in error_str:
            log_integrity_error("student_records", "create_student_record", ErrorCode.ALUMNI_NOT_FOUND.value, "Specified alumni does not exist", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALUMNI_NOT_FOUND.value,
                    message="Specified alumni does not exist"
                ).model_dump(mode='json')
            )
        else:
            log_integrity_error("student_records", "create_student_record", ErrorCode.INVALID_INPUT.value, "Student record creation failed", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Student record creation failed: Invalid input or constraint violation"
                ).model_dump(mode='json')
            )


@router.post("/batch")
def batch_create_student_records(
    batch_data: StudentRecordBatchCreate,
    session: Session = Depends(get_session)
):
    """Batch create student records"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, student_item in enumerate(batch_data.items):
        try:
            with session.begin_nested():
                # Verify course exists
                course = session.exec(
                    select(Course).where(Course.course_abbv == student_item.course_abbv.upper())
                ).first()
                
                if not course:
                    results.append(StudentRecordBatchCreateItem(
                        index=index,
                        item=StudentRecordCreateSafeDisplay(
                            student_id=student_item.student_id,
                            course_abbv=student_item.course_abbv,
                            alumni_id=student_item.alumni_id
                        ),
                        success=False,
                        code=ErrorCode.DEGREE_NOT_FOUND.value,
                        message=f"Course '{student_item.course_abbv}' not found",
                        data=None
                    ))
                    failed_count += 1
                    continue
                
                # Verify alumni exists
                alumni = session.exec(
                    select(Alumni).where(Alumni.alumni_id == student_item.alumni_id)
                ).first()
                
                if not alumni:
                    results.append(StudentRecordBatchCreateItem(
                        index=index,
                        item=StudentRecordCreateSafeDisplay(
                            student_id=student_item.student_id,
                            course_abbv=student_item.course_abbv,
                            alumni_id=student_item.alumni_id
                        ),
                        success=False,
                        code=ErrorCode.ALUMNI_NOT_FOUND.value,
                        message=f"Alumni '{student_item.alumni_id}' not found",
                        data=None
                    ))
                    failed_count += 1
                    continue
                
                # Create student record
                student_dict = student_item.model_dump(exclude={"alumni_id", "course_abbv"})
                student_dict["course_code"] = course.course_code
                student_dict["alumni_code"] = alumni.alumni_code
                
                new_student = StudentRecord.model_validate(student_dict)
                session.add(new_student)
                session.flush()  # Get student_code
                
                # Update alumni's student_code for backwards compatibility
                alumni.student_code = new_student.student_code
                session.add(alumni)
                session.flush()
                session.refresh(new_student)
                
                # Record successful creation
                results.append(StudentRecordBatchCreateItem(
                    index=index,
                    item=StudentRecordCreateSafeDisplay(
                        student_id=student_item.student_id,
                        course_abbv=student_item.course_abbv,
                        alumni_id=student_item.alumni_id
                    ),
                    success=True,
                    code=SuccessCode.STUDENT_RECORD_CREATED.value,
                    message="Student record created successfully",
                    data=StudentRecordPublic.model_validate(new_student)
                ))
                successful_count += 1
        
        except IntegrityError as e:
            # session.rollback() is handled automatically by the context manager on error
            error_str = str(e).lower()
            
            if "ix_student_records_student_id" in error_str or "student_records_student_id_key" in error_str:
                error_code = ErrorCode.DUPLICATE_STUDENT_ID.value
                error_msg = f"Student ID '{student_item.student_id}' already exists"
            elif "student_records_alumni_code_key" in error_str:
                error_code = ErrorCode.ALUMNI_ALREADY_HAS_STUDENT_RECORD.value
                error_msg = "This alumni already has a student record"
            else:
                error_code = ErrorCode.INVALID_INPUT.value
                error_msg = "Student record creation failed due to constraint violation"
            
            results.append(StudentRecordBatchCreateItem(
                index=index,
                item=StudentRecordCreateSafeDisplay(
                    student_id=student_item.student_id,
                    course_abbv=student_item.course_abbv,
                    alumni_id=student_item.alumni_id
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
            
            results.append(StudentRecordBatchCreateItem(
                index=index,
                item=StudentRecordCreateSafeDisplay(
                    student_id=student_item.student_id,
                    course_abbv=student_item.course_abbv,
                    alumni_id=student_item.alumni_id
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
    
    batch_response = StudentRecordBatchCreateResponse(
        total_items=len(batch_data.items),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.STUDENT_RECORDS_BATCH_CREATED.value,
        message=f"Batch create completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.get("")
def get_all_student_records(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by student ID"),
    year_graduated: int = Query(None, description="Filter by year graduated"),
    min_gwa: float = Query(None, description="Filter by minimum GWA"),
    max_gwa: float = Query(None, description="Filter by maximum GWA"),
    course_abbv: str = Query(None, description="Filter by course abbreviation"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    sort_by: str = Query("student_id", description="Sort by field (student_id, year_graduated, gwa)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):  
    """Get all student records with filtering, searching, and sorting"""
    # Build query
    query = select(StudentRecord) if include_deleted else select(StudentRecord).where(StudentRecord.is_deleted == False)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(StudentRecord.student_id.ilike(search_like))
    
    # Apply year_graduated filter
    if year_graduated:
        query = query.where(StudentRecord.year_graduated == year_graduated)
    
    # Apply GWA range filter
    if min_gwa is not None:
        query = query.where(StudentRecord.gwa >= min_gwa)
    if max_gwa is not None:
        query = query.where(StudentRecord.gwa <= max_gwa)
    
    # Apply course filter
    if course_abbv:
        course = session.exec(
            select(Course).where(Course.course_abbv == course_abbv.upper())
        ).first()
        if course:
            query = query.where(StudentRecord.course_code == course.course_code)
    
    # Get total count after filters
    count_query = select(func.count(StudentRecord.student_code)) if include_deleted else select(func.count(StudentRecord.student_code)).where(StudentRecord.is_deleted == False)
    total = session.exec(count_query).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "year_graduated":
        query = query.order_by(StudentRecord.year_graduated.desc() if sort_order_desc else StudentRecord.year_graduated)
    elif sort_by.lower() == "gwa":
        query = query.order_by(StudentRecord.gwa.desc() if sort_order_desc else StudentRecord.gwa)
    else:  # default to student_id
        query = query.order_by(StudentRecord.student_id.desc() if sort_order_desc else StudentRecord.student_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    students = session.exec(query).all()
    
    # Calculate pagination metadata
    returned = len(students)
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
        code=SuccessCode.STUDENT_RECORDS_RETRIEVED.value,
        message=f"Retrieved {returned} student records",
        data={"student_records": [StudentRecordPublic.model_validate(s) for s in students], "pagination": pagination}
    )

@router.get("/{student_id}")
def get_student_record(student_id: str, session: Session = Depends(get_session)):
    
    """Get a student record by student ID"""
    student = session.exec(
        select(StudentRecord).where((StudentRecord.student_id == student_id.upper()) & (StudentRecord.is_deleted == False))
    ).first()

    if not student:
        log_error("student_records", "get_student_record", ErrorCode.STUDENT_RECORD_NOT_FOUND.value, f"Student record {student_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value,
                message="Student record not found"
            ).model_dump(mode='json')
        )
    return StandardResponse(
        success=True,
        code=SuccessCode.STUDENT_RECORD_RETRIEVED.value,
        message=f"Student record {student_id} retrieved successfully",
        data=StudentRecordPublic.model_validate(student)
    )


@router.put("/batch")
def batch_update_student_records(
    batch_data: StudentRecordBatchUpdate,
    session: Session = Depends(get_session)
):
    """Batch update student records"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, update_item in enumerate(batch_data.items):
        try:
            with session.begin_nested():
                # Find the student record
                student = session.exec(
                    select(StudentRecord).where(StudentRecord.student_id == update_item.student_id.upper())
                ).first()
                
                if not student:
                    results.append(StudentRecordBatchUpdateResult(
                        index=index,
                        item=StudentRecordUpdateSafeDisplay(
                            student_id=update_item.student_id,
                            year_graduated=update_item.year_graduated,
                            gwa=update_item.gwa
                        ),
                        success=False,
                        code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value,
                        message=f"Student record '{update_item.student_id}' not found",
                        data=None
                    ))
                    failed_count += 1
                    continue
                
                # If alumni_id is provided, verify it exists and update the link
                if update_item.alumni_id is not None:
                    alumni = session.exec(
                        select(Alumni).where(Alumni.alumni_id == update_item.alumni_id)
                    ).first()
                    
                    if not alumni:
                        results.append(StudentRecordBatchUpdateResult(
                            index=index,
                            item=StudentRecordUpdateSafeDisplay(
                                student_id=update_item.student_id,
                                year_graduated=update_item.year_graduated,
                                gwa=update_item.gwa
                            ),
                            success=False,
                            code=ErrorCode.ALUMNI_NOT_FOUND.value,
                            message=f"Alumni '{update_item.alumni_id}' not found",
                            data=None
                        ))
                        failed_count += 1
                        continue
                    
                    # Update student's alumni_code link
                    student.alumni_code = alumni.alumni_code
                    alumni.student_code = student.student_code
                    session.add(alumni)
                
                # Update only provided fields
                if update_item.year_graduated is not None:
                    student.year_graduated = update_item.year_graduated
                if update_item.gwa is not None:
                    student.gwa = update_item.gwa
                if update_item.avg_prof_grade is not None:
                    student.avg_prof_grade = update_item.avg_prof_grade
                if update_item.avg_elec_grade is not None:
                    student.avg_elec_grade = update_item.avg_elec_grade
                if update_item.ojt_grade is not None:
                    student.ojt_grade = update_item.ojt_grade
                if update_item.leadership_pos is not None:
                    student.leadership_pos = update_item.leadership_pos
                if update_item.act_member_pos is not None:
                    student.act_member_pos = update_item.act_member_pos
                
                session.add(student)
                session.flush()
                session.refresh(student)
                
                # Record successful update
                results.append(StudentRecordBatchUpdateResult(
                    index=index,
                    item=StudentRecordUpdateSafeDisplay(
                        student_id=update_item.student_id,
                        year_graduated=update_item.year_graduated,
                        gwa=update_item.gwa
                    ),
                    success=True,
                    code=SuccessCode.STUDENT_RECORD_UPDATED.value,
                    message="Student record updated successfully",
                    data=StudentRecordPublic.model_validate(student)
                ))
                successful_count += 1
        
        except IntegrityError as e:
            # session.rollback() is handled automatically by the context manager on error
            error_str = str(e).lower()
            
            if "student_records_alumni_code_key" in error_str:
                error_code = ErrorCode.ALUMNI_ALREADY_HAS_STUDENT_RECORD.value
                error_msg = "This alumni already has a student record"
            elif "ix_student_records_student_id" in error_str or "student_records_student_id_key" in error_str:
                error_code = ErrorCode.DUPLICATE_STUDENT_ID.value
                error_msg = "Student ID already in use"
            else:
                error_code = ErrorCode.INVALID_INPUT.value
                error_msg = "Student record update failed due to constraint violation"
            
            results.append(StudentRecordBatchUpdateResult(
                index=index,
                item=StudentRecordUpdateSafeDisplay(
                    student_id=update_item.student_id,
                    year_graduated=update_item.year_graduated,
                    gwa=update_item.gwa
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
            
            results.append(StudentRecordBatchUpdateResult(
                index=index,
                item=StudentRecordUpdateSafeDisplay(
                    student_id=update_item.student_id,
                    year_graduated=update_item.year_graduated,
                    gwa=update_item.gwa
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
    
    batch_response = StudentRecordBatchUpdateResponse(
        total_items=len(batch_data.items),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.STUDENT_RECORDS_BATCH_UPDATED.value,
        message=f"Batch update completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )


@router.put("/{student_id}")
def update_student_record(
    student_id: str,
    student_data: StudentRecordUpdate,
    session: Session = Depends(get_session)
):
    """Update a student record"""
    student = session.exec(
        select(StudentRecord).where(StudentRecord.student_id == student_id.upper())
    ).first()
    
    if not student:
        log_error("student_records", "update_student_record", ErrorCode.STUDENT_RECORD_NOT_FOUND.value, f"Student record {student_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value,
                message="Student record not found"
            ).model_dump(mode='json')
        )
    
    # If alumni_id is provided, verify it exists and update the link
    if student_data.alumni_id is not None:
        alumni = session.exec(
            select(Alumni).where(Alumni.alumni_id == student_data.alumni_id)
        ).first()
        
        if not alumni:
            log_error("student_records", "update_student_record", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {student_data.alumni_id} not found")
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALUMNI_NOT_FOUND.value,
                    message="Alumni not found"
                ).model_dump(mode='json')
            )
        
        # Update student's alumni_code link and alumni's student_code for backwards compatibility
        student.alumni_code = alumni.alumni_code
        alumni.student_code = student.student_code
        session.add(alumni)
    
    # Update only provided fields
    if student_data.year_graduated is not None:
        student.year_graduated = student_data.year_graduated
    if student_data.gwa is not None:
        student.gwa = student_data.gwa
    if student_data.avg_prof_grade is not None:
        student.avg_prof_grade = student_data.avg_prof_grade
    if student_data.avg_elec_grade is not None:
        student.avg_elec_grade = student_data.avg_elec_grade
    if student_data.ojt_grade is not None:
        student.ojt_grade = student_data.ojt_grade
    if student_data.leadership_pos is not None:
        student.leadership_pos = student_data.leadership_pos
    if student_data.act_member_pos is not None:
        student.act_member_pos = student_data.act_member_pos
    
    session.add(student)
    
    try:
        session.commit()
        session.refresh(student)
        return StandardResponse(
            success=True,
            code=SuccessCode.STUDENT_RECORD_UPDATED.value,
            message="Student record updated successfully",
            data=StudentRecordPublic.model_validate(student)
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "student_records_alumni_code_key" in error_str:
            log_integrity_error("student_records", "update_student_record", ErrorCode.ALUMNI_ALREADY_HAS_STUDENT_RECORD.value, "Alumni already has student record", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALUMNI_ALREADY_HAS_STUDENT_RECORD.value,
                    message="This alumni already has a student record"
                ).model_dump(mode='json')
            )
        elif "student_records_course_code_fkey" in error_str or "course_code" in error_str:
            log_integrity_error("student_records", "update_student_record", ErrorCode.DEGREE_NOT_FOUND.value, "Specified course does not exist", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DEGREE_NOT_FOUND.value,
                    message="Specified course does not exist"
                ).model_dump(mode='json')
            )
        elif "student_records_alumni_code_fkey" in error_str or "alumni_code" in error_str:
            log_integrity_error("student_records", "update_student_record", ErrorCode.ALUMNI_NOT_FOUND.value, "Specified alumni does not exist", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALUMNI_NOT_FOUND.value,
                    message="Specified alumni does not exist"
                ).model_dump(mode='json')
            )
        elif "ix_student_records_student_id" in error_str or "student_records_student_id_key" in error_str:
            log_integrity_error("student_records", "update_student_record", ErrorCode.DUPLICATE_STUDENT_ID.value, "Student ID already in use", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_STUDENT_ID.value,
                    message="Student ID already in use"
                ).model_dump(mode='json')
            )
        else:
            log_integrity_error("student_records", "update_student_record", ErrorCode.INVALID_INPUT.value, "Update failed", str(e))
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Update failed: Invalid input or constraint violation"
                ).model_dump(mode='json')
            )


@router.delete("/batch")
def batch_delete_student_records(
    batch_data: StudentRecordBatchDelete,
    session: Session = Depends(get_session)
):
    """Batch delete student records"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, student_id in enumerate(batch_data.ids):
        try:
            # Find the student record
            student = session.exec(
                select(StudentRecord).where(StudentRecord.student_id == student_id.upper())
            ).first()
            
            if not student:
                results.append(StudentRecordBatchDeleteResult(
                    index=index,
                    student_id=student_id,
                    success=False,
                    code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value,
                    message=f"Student record '{student_id}' not found"
                ))
                failed_count += 1
                continue
            
            # Check if already deleted
            if student.is_deleted:
                results.append(StudentRecordBatchDeleteResult(
                    index=index,
                    student_id=student_id,
                    success=False,
                    code=ErrorCode.ALREADY_DELETED.value,
                    message="Student record is already deleted, cannot delete again"
                ))
                failed_count += 1
                continue
            
            # Soft delete
            student.is_deleted = True
            student.deleted_at = get_current_time_gmt8()
            session.add(student)
            session.flush()
            
            # Record successful deletion
            results.append(StudentRecordBatchDeleteResult(
                index=index,
                student_id=student_id,
                success=True,
                code=SuccessCode.STUDENT_RECORD_DELETED.value,
                message="Student record deleted successfully"
            ))
            successful_count += 1
        
        except IntegrityError as e:
            session.rollback()
            results.append(StudentRecordBatchDeleteResult(
                index=index,
                student_id=student_id,
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Student record deletion failed due to constraint violation"
            ))
            failed_count += 1
        
        except ValueError as e:
            error_msg = str(e)
            results.append(StudentRecordBatchDeleteResult(
                index=index,
                student_id=student_id,
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
    
    batch_response = StudentRecordBatchDeleteResponse(
        total_items=len(batch_data.ids),
        successful=successful_count,
        failed=failed_count,
        results=results
    )
    
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.STUDENT_RECORDS_BATCH_DELETED.value,
        message=f"Batch delete completed: {successful_count} successful, {failed_count} failed",
        data=batch_response
    )

@router.delete("/{student_id}")
def delete_student_record(student_id: str, session: Session = Depends(get_session)):
    """Delete a student record"""
    student = session.exec(
        select(StudentRecord).where(StudentRecord.student_id == student_id.upper())
    ).first()
    
    if not student:
        log_error("student_records", "delete_student_record", ErrorCode.STUDENT_RECORD_NOT_FOUND.value, f"Student record {student_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value,
                message="Student record not found"
            ).model_dump(mode='json')
        )
    
    if student.is_deleted:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALREADY_DELETED.value,
                message="Student record is already deleted, cannot delete again"
            ).model_dump(mode='json')
        )
    
    try:
        # Soft delete
        student.is_deleted = True
        student.deleted_at = get_current_time_gmt8()
        session.add(student)
        session.commit()
        return StandardResponse(
            success=True,
            code=SuccessCode.STUDENT_RECORD_DELETED.value,
            message=f"Student record {student_id} deleted successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("student_records", "delete_student_record", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
        raise HTTPException(
            status_code=400,
            detail={
                "code": ErrorCode.INVALID_INPUT.value,
                "message": "Delete failed: Constraint violation or invalid operation"
            }
        )


@router.post("/batch/restore")
def batch_restore_student_records(
    data: StudentRecordBatchRestore,
    session: Session = Depends(get_session)
):
    """Restore multiple soft-deleted student records"""
    results = []
    successful_count = 0
    failed_count = 0
    
    for index, student_id in enumerate(data.ids):
        try:
            student = session.exec(
                select(StudentRecord).where(StudentRecord.student_id == student_id.upper())
            ).first()
            
            if not student:
                results.append(StudentRecordBatchRestoreResult(
                    index=index,
                    student_id=student_id,
                    success=False,
                    code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value,
                    message=f"Student record '{student_id}' not found"
                ))
                failed_count += 1
                continue
            
            if not student.is_deleted:
                results.append(StudentRecordBatchRestoreResult(
                    index=index,
                    student_id=student_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"Student record '{student_id}' is not deleted"
                ))
                failed_count += 1
                continue
            
            # Restore student record
            student.is_deleted = False
            student.deleted_at = None
            session.add(student)
            session.flush()
            
            # Record successful restoration
            results.append(StudentRecordBatchRestoreResult(
                index=index,
                student_id=student_id,
                success=True,
                code=SuccessCode.STUDENT_RECORD_RESTORED.value,
                message="Student record restored successfully"
            ))
            successful_count += 1
        
        except IntegrityError as e:
            session.rollback()
            error_code = ErrorCode.INVALID_INPUT.value
            error_msg = "Restore failed: Constraint violation or related data issue"
            results.append(StudentRecordBatchRestoreResult(
                index=index,
                student_id=student_id,
                success=False,
                code=error_code,
                message=error_msg
            ))
            log_integrity_error("student_records", "batch_restore_student_records", error_code, error_msg, str(e))
            failed_count += 1
    
    session.commit()
    return StandardResponse(
        success=failed_count == 0,
        code=SuccessCode.STUDENT_RECORDS_BATCH_RESTORED.value,
        message=f"Restore operation completed: {successful_count} succeeded, {failed_count} failed",
        data=StudentRecordBatchRestoreResponse(
            total_items=len(data.ids),
            successful=successful_count,
            failed=failed_count,
            results=results
        )
    )


@router.post("/{student_id}/restore")
def restore_student_record(student_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted student record"""
    student = session.exec(
        select(StudentRecord).where(StudentRecord.student_id == student_id.upper())
    ).first()
    
    if not student:
        log_error("student_records", "restore_student_record", ErrorCode.STUDENT_RECORD_NOT_FOUND.value, f"Student record {student_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value,
                message="Student record not found"
            ).model_dump(mode='json')
        )
    
    if not student.is_deleted:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Student record is not deleted, cannot restore"
            ).model_dump(mode='json')
        )
    
    try:
        # Restore soft-deleted student record
        student.is_deleted = False
        student.deleted_at = None
        session.add(student)
        session.commit()
        return StandardResponse(
            success=True,
            code=SuccessCode.STUDENT_RECORD_RESTORED.value,
            message=f"Student record {student_id} restored successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("student_records", "restore_student_record", ErrorCode.INVALID_INPUT.value, "Restore failed", str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Restore failed: Constraint violation or invalid operation"
            ).model_dump(mode='json')
        )


@router.get("/deleted/list")
def get_deleted_student_records(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by student ID"),
    sort_by: str = Query("deleted_at", description="Sort by field (student_id, year_graduated, gwa, deleted_at)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all soft-deleted student records (admin endpoint)"""
    # Build query - only show deleted records
    query = select(StudentRecord).where(StudentRecord.is_deleted == True)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(StudentRecord.student_id.ilike(search_like))
    
    # Get total count
    total = session.exec(select(func.count(StudentRecord.student_code)).where(StudentRecord.is_deleted == True)).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "year_graduated":
        query = query.order_by(StudentRecord.year_graduated.desc() if sort_order_desc else StudentRecord.year_graduated)
    elif sort_by.lower() == "gwa":
        query = query.order_by(StudentRecord.gwa.desc() if sort_order_desc else StudentRecord.gwa)
    elif sort_by.lower() == "deleted_at":
        query = query.order_by(StudentRecord.deleted_at.desc() if sort_order_desc else StudentRecord.deleted_at)
    else:  # default to student_id
        query = query.order_by(StudentRecord.student_id.desc() if sort_order_desc else StudentRecord.student_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    records = session.exec(query).all()
    public_records = [StudentRecordPublic.model_validate(record) for record in records]
    
    # Calculate pagination metadata
    returned = len(records)
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
        code=SuccessCode.STUDENT_RECORDS_RETRIEVED.value,
        message=f"Retrieved {returned} deleted student records",
        data=public_records,
        pagination=pagination
    )


@router.get("/all/list")
def get_all_student_records_including_deleted(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by student ID"),
    year_graduated: int = Query(None, description="Filter by year graduated"),
    min_gwa: float = Query(None, description="Filter by minimum GWA"),
    max_gwa: float = Query(None, description="Filter by maximum GWA"),
    course_abbv: str = Query(None, description="Filter by course abbreviation"),
    sort_by: str = Query("student_id", description="Sort by field (student_id, year_graduated, gwa)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all student records including soft-deleted (admin endpoint)"""
    # Build query - include all records
    query = select(StudentRecord)
    
    # Apply search filter
    if search:
        search_like = f"%{search}%"
        query = query.where(StudentRecord.student_id.ilike(search_like))
    
    # Apply year_graduated filter
    if year_graduated:
        query = query.where(StudentRecord.year_graduated == year_graduated)
    
    # Apply GWA range filter
    if min_gwa is not None:
        query = query.where(StudentRecord.gwa >= min_gwa)
    if max_gwa is not None:
        query = query.where(StudentRecord.gwa <= max_gwa)
    
    # Apply course filter
    if course_abbv:
        course = session.exec(
            select(Course).where(Course.course_abbv == course_abbv.upper())
        ).first()
        if course:
            query = query.where(StudentRecord.course_code == course.course_code)
    
    # Get total count
    total = session.exec(select(func.count(StudentRecord.student_code))).one()
    
    # Apply sorting
    sort_order_desc = sort_order.lower() == "desc"
    if sort_by.lower() == "year_graduated":
        query = query.order_by(StudentRecord.year_graduated.desc() if sort_order_desc else StudentRecord.year_graduated)
    elif sort_by.lower() == "gwa":
        query = query.order_by(StudentRecord.gwa.desc() if sort_order_desc else StudentRecord.gwa)
    else:  # default to student_id
        query = query.order_by(StudentRecord.student_id.desc() if sort_order_desc else StudentRecord.student_id)
    
    # Apply pagination
    if limit > 0:
        query = query.offset(offset).limit(limit)
    
    records = session.exec(query).all()
    public_records = [StudentRecordPublic.model_validate(record) for record in records]
    
    # Calculate pagination metadata
    returned = len(records)
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
        code=SuccessCode.STUDENT_RECORDS_RETRIEVED.value,
        message=f"Retrieved {returned} student records (including deleted)",
        data=public_records,
        pagination=pagination
    )