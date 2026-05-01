import sys

path = "/mnt/sdb4/Programming/Python/Web Projects/pace/backend/routers/alumni.py"

with open(path, "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "def get_my_activity_history(" in line:
        insert_idx = i
        break

code_to_insert = """        ),
        ttl=ALUMNI_PROFILE_TTL
    )

@router.get("/me/export/excel")
def export_my_data_excel(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    \"\"\"Export current user's data as Excel file\"\"\"
    import pandas as pd
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    from models.surveys import SurveyResponse
    from sqlmodel import select

    if current_user.user_type != UserType.USER.value:
        raise HTTPException(
            status_code=403,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORBIDDEN.value,
                message="Only alumni can access this endpoint"
            ).model_dump(mode='json')
        )

    if not current_user.id:
        raise HTTPException(status_code=404, detail="Alumni profile link not found")

    alumni = get_alumni_by_user_ref_id(session, current_user.id)
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni profile not found")

    full_profile = build_full_profile(session, alumni)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Sheet 1: Personal Overview
        profile_data = {
            "Information Type": ["Alumni ID", "First Name", "Last Name", "Email", "Gender", "Birthdate", "Age"],
            "Details": [
                full_profile["alumni_id"],
                full_profile["first_name"],
                full_profile["last_name"],
                full_profile["email"],
                full_profile["gender"],
                str(full_profile["birthdate"]) if full_profile.get("birthdate") else "Not Set",
                full_profile["age"]
            ]
        }
        pd.DataFrame(profile_data).to_excel(writer, sheet_name="Personal Profile", index=False)
        
        # Sheet 2: Academic Record
        academic_data = {
            "Information Type": ["Student ID", "Course", "Year Graduated", "GWA", "Avg Professional Grade", "Avg Elective Grade", "OJT Grade", "Leadership Position", "Active Member Position"],
            "Details": [
                full_profile.get("student_id") or "Not Set",
                full_profile.get("course_name") or "Not Set",
                full_profile.get("year_graduated") or "Not Set",
                full_profile.get("gwa") or "Not Set",
                full_profile.get("avg_prof_grade") or "Not Set",
                full_profile.get("avg_elec_grade") or "Not Set",
                full_profile.get("ojt_grade") or "Not Set",
                "Yes" if full_profile.get("leadership_pos") else "No",
                "Yes" if full_profile.get("act_member_pos") else "No"
            ]
        }
        pd.DataFrame(academic_data).to_excel(writer, sheet_name="Academic Record", index=False)
        
        # Sheet 3: Employment Details
        emp_data = {
            "Information Type": ["Employment Status", "Employment Sector", "Salary Package", "Offers Received"],
            "Details": [
                full_profile.get("employment_status") or "Not Set",
                full_profile.get("employment_sector") or "Not Set",
                full_profile.get("salary_package") or "0",
                full_profile.get("offers_received") or "0"
            ]
        }
        pd.DataFrame(emp_data).to_excel(writer, sheet_name="Employment Status", index=False)
        
        # Sheet 4: Skills
        if full_profile.get("skills"):
            pd.DataFrame({"Recorded Skills": full_profile["skills"]}).to_excel(writer, sheet_name="Professional Skills", index=False)
            
        # Sheet 5: Survey Responses
        survey_responses = session.exec(
            select(SurveyResponse).where(
                SurveyResponse.alumni_ref_id == alumni.id,
                SurveyResponse.is_deleted == False
            )
        ).all()
        
        if survey_responses:
            survey_data = []
            for resp in survey_responses:
                row = {
                    "Response ID": resp.response_id,
                    "Submitted At": str(resp.submitted_at.strftime("%Y-%m-%d %H:%M:%S")),
                    "Status": "Complete" if resp.is_complete else "Incomplete",
                }
                if resp.answers:
                    for i, ans in enumerate(resp.answers, 1):
                        q_id = ans.get("question_id", f"Q{i}")
                        val = ans.get("answer_value")
                        if isinstance(val, list):
                            val = ", ".join(map(str, val))
                        row[f"Answer: {q_id}"] = str(val)
                survey_data.append(row)
            pd.DataFrame(survey_data).to_excel(writer, sheet_name="Survey Submissions", index=False)

    output.seek(0)
    
    filename = f"{full_profile['last_name']}_{full_profile['first_name']}_DataExport.xlsx".replace(" ", "_")
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    return StreamingResponse(
        output, 
        headers=headers, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@router.get("/activity/me", response_model=StandardResponse)
"""

# Replace the broken closing parens from before
# Lines 359-366:
# 359:     return cache_get_or_set(
# 360:         cache_key,
# 361:         lambda: StandardResponse(
# 362:             success=True,
# 363:             code=SuccessCode.ALUMNI_RETRIEVED.value,
# 364:             message=f"Alumni {alumni.alumni_id} retrieved successfully",
# 365:             data=build_full_profile(session, alumni)
# 366: 

# Delete line 366 (which is blank or closing parens incorrectly) and insert the new code
del lines[insert_idx - 1] 

lines.insert(insert_idx - 1, code_to_insert)

with open(path, "w") as f:
    f.writelines(lines)
