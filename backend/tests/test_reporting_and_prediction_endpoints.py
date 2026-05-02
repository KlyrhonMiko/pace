from types import SimpleNamespace

from sqlmodel import select

from models.alumni_regression_prediction import AlumniRegressionPrediction
from models.arima_forecast_result import ArimaForecastResult
from models.employability import EmployabilityPrediction
from models.transaction_logs import TransactionLog
from tests.api_helpers import create_college_dept, create_course
from tests.helpers import assert_standard_response, extract_data


def test_transaction_logs_dashboard_and_model_info(client, auth_headers, monkeypatch):
    admin_headers = auth_headers("admin")
    auth_headers("staff")
    auth_headers("alumni")

    monkeypatch.setattr(
        "routers.dashboard.get_admin_dashboard_stats",
        lambda session: {
            "total_users": 5,
            "verified_alumni": 1,
            "active_jobs": 2,
            "upcoming_events": 1,
        },
    )
    monkeypatch.setattr(
        "routers.dashboard.get_faculty_dashboard_stats",
        lambda session, user_id: {
            "alumni_advised": 1,
            "events_organized": 0,
            "placement_rate": 100,
            "referrals_sent": 0,
            "avg_offers": 1.0,
            "avg_package": 32000.0,
            "top_sector": "Technology",
            "placement_distribution": {
                "employed": 1,
                "interviewing": 0,
                "searching": 0,
            },
        },
    )
    monkeypatch.setattr("routers.dashboard.get_faculty_alumni_progress", lambda session: [{"alumni_id": "ALMN-000001"}])
    monkeypatch.setattr("routers.dashboard.get_faculty_upcoming_sessions", lambda session, user_id: [])
    monkeypatch.setattr("routers.dashboard.get_platform_activity_feed", lambda session: [])
    monkeypatch.setattr(
        "routers.dashboard.get_alumni_dashboard_stats",
        lambda session, user_id: {
            "job_applications": 0,
            "registered_events": 0,
            "upcoming_interviews": 0,
            "profile_completeness": 100,
        },
    )
    monkeypatch.setattr("routers.dashboard.get_alumni_recent_activity", lambda session, user_id, limit: [])

    logs = client.get("/transaction-logs", headers=admin_headers)
    assert logs.status_code == 200
    log_payload = assert_standard_response(logs.json(), success=True)
    assert log_payload["data"]["pagination"]["total"] >= 1
    tl_id = log_payload["data"]["transaction_logs"][0]["tl_id"]

    log_detail = client.get(f"/transaction-logs/{tl_id}", headers=admin_headers)
    assert log_detail.status_code == 200
    assert_standard_response(log_detail.json(), success=True)

    admin_stats = client.get("/dashboard/admin/stats", headers=admin_headers)
    faculty_stats = client.get("/dashboard/faculty/stats", headers=auth_headers("staff"))
    faculty_progress = client.get("/dashboard/faculty/progress", headers=auth_headers("staff"))
    faculty_sessions = client.get("/dashboard/faculty/sessions", headers=auth_headers("staff"))
    faculty_activity = client.get("/dashboard/faculty/activity", headers=auth_headers("staff"))
    alumni_stats = client.get("/dashboard/alumni/stats", headers=auth_headers("alumni"))
    alumni_activity = client.get("/dashboard/alumni/activity", headers=auth_headers("alumni"))

    for response in [
        admin_stats,
        faculty_stats,
        faculty_progress,
        faculty_sessions,
        faculty_activity,
        alumni_stats,
        alumni_activity,
    ]:
        assert response.status_code == 200
        assert_standard_response(response.json(), success=True)

    model_info = client.get("/predict/models/info", headers=admin_headers)
    assert model_info.status_code == 200
    model_payload = extract_data(assert_standard_response(model_info.json(), success=True))
    assert model_payload["total_models"] >= 1


def test_prediction_regression_and_forecast_routes(client, auth_headers, monkeypatch, db_session):
    admin_headers = auth_headers("admin")
    alumni_headers = auth_headers("alumni")
    staff_headers = auth_headers("staff")

    dept = create_college_dept(client, admin_headers)
    create_course(client, admin_headers, college_dept_abbv=dept["college_dept_abbv"])

    student_record = client.post(
        "/student-records",
        headers=admin_headers,
        json={
            "student_id": "202400099",
            "year_graduated": 2024,
            "gwa": 1.7,
            "avg_prof_grade": 1.8,
            "avg_elec_grade": 1.9,
            "ojt_grade": 1.5,
            "leadership_pos": True,
            "act_member_pos": True,
            "course_abbv": "BSIT",
            "alumni_id": "ALMN-000001",
        },
    )
    assert student_record.status_code == 200

    skills = client.post(
        "/alumni-skills",
        headers=alumni_headers,
        json={
            "alumni_id": "ALMN-000001",
            "soft_skills_ave": 87,
            "hard_skills_ave": 90,
            "program_skills": {"Python Programming Skills": 93},
            "program_skills_average": 93,
        },
    )
    assert skills.status_code == 200

    class FakeEmployabilityPredictor:
        is_loaded = True

        def predict(self, student_dict):
            return {
                "realistic_assessment": {"prediction": "Employable", "probability": 0.81},
                "improvement_roadmap": {"prediction": "Highly Employable", "probability": 0.9},
            }

    class FakeRegressionResult:
        predicted_salary_php = 32000.0
        predicted_job_search_weeks = 6.0
        salary_band = "30k-35k"
        search_outlook = "Good"

        def to_dict(self):
            return {
                "predicted_salary_php": self.predicted_salary_php,
                "predicted_job_search_weeks": self.predicted_job_search_weeks,
                "salary_band": self.salary_band,
                "search_outlook": self.search_outlook,
            }

    class FakeRegressionPredictor:
        def predict(self, **kwargs):
            return FakeRegressionResult()

    class FakeArimaForecast:
        def __init__(self, real_data, forecast_steps):
            self.real_data = real_data
            self.forecast_steps = forecast_steps

        def forecast(self):
            return {
                "data_source": "synthetic",
                "observations": 3,
                "forecast": [70.0, 72.0, 74.0],
            }

    monkeypatch.setattr("routers.predict.get_predictor", lambda: FakeEmployabilityPredictor())
    monkeypatch.setattr("routers.regression.get_regression_predictor", lambda: FakeRegressionPredictor())
    monkeypatch.setattr("routers.forecast.ArimaForecast", FakeArimaForecast)
    monkeypatch.setattr("routers.forecast.get_historical_employment_counts", lambda db: [60, 62, 65])

    employability = client.post("/predict/employability/ALMN-000001", headers=alumni_headers)
    assert employability.status_code == 200
    employability_payload = extract_data(assert_standard_response(employability.json(), success=True))
    employability_prediction_id = employability_payload["prediction_id"]

    regression = client.post("/predict/regression/ALMN-000001", headers=alumni_headers)
    assert regression.status_code == 200
    regression_payload = extract_data(assert_standard_response(regression.json(), success=True))
    regression_prediction_id = regression_payload["prediction_id"]

    my_predictions = client.get("/predict/employability/me", headers=alumni_headers)
    regression_me = client.get("/predict/regression/me", headers=alumni_headers)
    prediction_detail = client.get(f"/predict/employability/{employability_prediction_id}", headers=alumni_headers)
    regression_detail = client.get(f"/predict/regression/{regression_prediction_id}", headers=alumni_headers)
    alumni_prediction_list = client.get("/predict/employability/alumni/ALMN-000001", headers=staff_headers)
    alumni_regression_list = client.get("/predict/regression/alumni/ALMN-000001", headers=staff_headers)

    for response in [
        my_predictions,
        regression_me,
        prediction_detail,
        regression_detail,
        alumni_prediction_list,
        alumni_regression_list,
    ]:
        assert response.status_code == 200
        assert_standard_response(response.json(), success=True)

    forecast = client.post("/predict/forecast?forecast_steps=3", headers=staff_headers)
    assert forecast.status_code == 200
    forecast_payload = extract_data(assert_standard_response(forecast.json(), success=True))
    forecast_id = forecast_payload["forecast_id"]

    forecast_latest = client.get("/predict/forecast/latest", headers=staff_headers)
    forecast_history = client.get("/predict/forecast/history", headers=staff_headers)
    forecast_detail = client.get(f"/predict/forecast/{forecast_id}", headers=staff_headers)
    for response in [forecast_latest, forecast_history, forecast_detail]:
        assert response.status_code == 200
        assert_standard_response(response.json(), success=True)

    db_session.expire_all()
    employability_row = db_session.exec(select(EmployabilityPrediction)).first()
    regression_row = db_session.exec(select(AlumniRegressionPrediction)).first()
    forecast_row = db_session.exec(select(ArimaForecastResult)).first()
    assert employability_row is not None and employability_row.alumni_ref_id is not None
    assert regression_row is not None and regression_row.alumni_ref_id is not None
    assert forecast_row is not None and forecast_row.requested_by_ref_id is not None


def test_prediction_routes_reject_unauthorized_roles(client, auth_headers):
    alumni_headers = auth_headers("alumni")
    forbidden = client.post("/predict/forecast", headers=alumni_headers)
    assert forbidden.status_code == 403
    assert_standard_response(forbidden.json(), success=False)
