import pickle
import uuid

import numpy as np
from sqlmodel import select

from models.alumni import Alumni
from models.job_listings import JobListing
from tests.api_helpers import create_job
from tests.helpers import assert_standard_response, extract_data


def test_job_matching_service_handles_first_load_failure_and_recovers(monkeypatch):
    import services.machines.job_matching as job_matching_module

    class FakeModel:
        def encode(self, text: str):
            return np.array([0.1, 0.2, 0.3])

    calls = {"count": 0}

    def fake_sentence_transformer(_model_name: str, device: str | None = None):
        calls["count"] += 1
        if calls["count"] == 1:
            raise RuntimeError("meta tensor boot failure")
        return FakeModel()

    monkeypatch.setattr(job_matching_module, "SentenceTransformer", fake_sentence_transformer)
    monkeypatch.setattr(job_matching_module, "cosine_similarity", lambda a, b: np.array([[0.5]]))

    service = job_matching_module.JobMatchingService()
    job_embeddings = [
        (uuid.uuid4(), pickle.dumps(np.array([0.1, 0.2, 0.3])), "Backend Engineer", "PACE Labs")
    ]

    first_result = service.calculate_similarity("python, sql", job_embeddings)
    assert first_result == []
    assert service.get_runtime_status()["runtime_available"] is False
    assert service.get_runtime_status()["last_load_error"] == "meta tensor boot failure"

    second_result = service.calculate_similarity("python, sql", job_embeddings)
    assert len(second_result) == 1
    assert second_result[0]["title"] == "Backend Engineer"
    assert service.get_runtime_status()["runtime_available"] is True
    assert service.get_runtime_status()["last_load_error"] is None


def test_job_matching_service_falls_back_from_gpu_to_cpu_on_load(monkeypatch):
    import services.machines.job_matching as job_matching_module

    class FakeCuda:
        @staticmethod
        def is_available():
            return True

        @staticmethod
        def current_device():
            return 0

        @staticmethod
        def get_device_name(_index: int):
            return "AMD Radeon Pro"

    class FakeTorch:
        cuda = FakeCuda()

        class version:
            hip = "6.0"

    class FakeModel:
        def encode(self, text: str):
            return np.array([0.5, 0.4, 0.3])

    attempts: list[str] = []

    def fake_sentence_transformer(_model_name: str, device: str | None = None):
        attempts.append(device or "cpu")
        if device == "cuda":
            raise RuntimeError("gpu init failed")
        return FakeModel()

    monkeypatch.setattr(job_matching_module, "torch", FakeTorch)
    monkeypatch.setattr(job_matching_module, "SentenceTransformer", fake_sentence_transformer)

    service = job_matching_module.JobMatchingService()
    model = service.load_model()

    assert model is not None
    assert attempts == ["cuda", "cpu"]
    assert service.get_runtime_status()["runtime_available"] is True
    assert service.get_runtime_status()["active_device"] == "cpu"
    assert service.get_runtime_status()["active_backend"] == "cpu"


def test_job_matching_service_falls_back_to_cpu_when_gpu_encode_fails(monkeypatch):
    import services.machines.job_matching as job_matching_module

    class FakeCudaModel:
        def encode(self, text: str):
            raise RuntimeError("gpu encode failed")

    class FakeCpuModel:
        def encode(self, text: str):
            return np.array([0.9, 0.1, 0.2])

    models_by_device = {
        "cuda": FakeCudaModel(),
        "cpu": FakeCpuModel(),
    }

    def fake_sentence_transformer(_model_name: str, device: str | None = None):
        return models_by_device[device or "cpu"]

    monkeypatch.setattr(job_matching_module, "SentenceTransformer", fake_sentence_transformer)

    service = job_matching_module.JobMatchingService()
    service._model = models_by_device["cuda"]
    service._active_device = "cuda"
    service._active_backend = "cuda"
    service._active_device_name = "NVIDIA RTX"

    embedding = service.generate_embedding("python, sql")

    assert embedding is not None
    assert np.allclose(embedding, np.array([0.9, 0.1, 0.2]))
    assert service.get_runtime_status()["active_device"] == "cpu"
    assert service.get_runtime_status()["active_backend"] == "cpu"


def test_job_matching_service_blank_text_returns_no_embedding():
    import services.machines.job_matching as job_matching_module

    service = job_matching_module.JobMatchingService()
    assert service.generate_embedding("   ") is None
    assert service.generate_and_serialize("") is None


def test_jobs_match_route_returns_empty_success_when_model_unavailable(client, auth_headers, db_session, monkeypatch):
    import routers.jobs as jobs_router
    import services.queries.jobs_queries as jobs_queries_module

    employer_headers = auth_headers("employer")
    alumni_headers = auth_headers("alumni")

    monkeypatch.setattr(
        jobs_queries_module.job_matching_service,
        "generate_and_serialize",
        lambda text: pickle.dumps(np.array([0.4, 0.3, 0.2])),
    )

    created_job = create_job(client, employer_headers)

    alumni = db_session.exec(select(Alumni).where(Alumni.alumni_id == "ALMN-000001")).first()
    assert alumni is not None
    alumni.skills = ["Python", "SQL"]
    db_session.add(alumni)
    db_session.commit()

    jobs_router.job_matching_service._model = None
    jobs_router.job_matching_service._last_load_error = "meta tensor boot failure"
    monkeypatch.setattr(jobs_router.job_matching_service, "load_model", lambda: None)

    response = client.get("/jobs/match/ALMN-000001", headers=alumni_headers)
    assert response.status_code == 200
    payload = assert_standard_response(response.json(), success=True)
    assert payload["message"] == "Semantic job matching is temporarily unavailable. Please try again shortly."
    assert payload["data"] == []
    assert created_job["title"] == "Backend Engineer"


def test_jobs_match_route_happy_path_returns_ranked_matches(client, auth_headers, db_session, monkeypatch):
    import routers.jobs as jobs_router
    import services.queries.jobs_queries as jobs_queries_module

    employer_headers = auth_headers("employer")
    alumni_headers = auth_headers("alumni")

    embedding_bytes = pickle.dumps(np.array([0.9, 0.1, 0.2]))
    monkeypatch.setattr(
        jobs_queries_module.job_matching_service,
        "generate_and_serialize",
        lambda text: embedding_bytes,
    )

    created_job = create_job(client, employer_headers, title="ML Engineer")

    alumni = db_session.exec(select(Alumni).where(Alumni.alumni_id == "ALMN-000001")).first()
    assert alumni is not None
    alumni.skills = ["Python", "Machine Learning"]
    db_session.add(alumni)
    db_session.commit()

    monkeypatch.setattr(jobs_router.job_matching_service, "load_model", lambda: object())
    monkeypatch.setattr(
        jobs_router.job_matching_service,
        "calculate_similarity",
        lambda profile_text, job_embeddings: [
            {
                "job_id": created_job["id"],
                "title": "ML Engineer",
                "company": created_job["company"],
                "similarity_score": 0.51,
                "match_percentage": 82.5,
            }
        ],
    )

    response = client.get("/jobs/match/ALMN-000001", headers=alumni_headers)
    assert response.status_code == 200
    payload = extract_data(assert_standard_response(response.json(), success=True))
    assert len(payload) == 1
    assert payload[0]["title"] == "ML Engineer"
    assert payload[0]["match_percentage"] == 82.5


def test_job_create_and_update_preserve_embedding_state_when_generation_unavailable(
    client,
    auth_headers,
    db_session,
    monkeypatch,
):
    import services.queries.jobs_queries as jobs_queries_module

    employer_headers = auth_headers("employer")

    monkeypatch.setattr(jobs_queries_module.job_matching_service, "generate_and_serialize", lambda text: None)
    created_without_embedding = create_job(client, employer_headers, title="No Embedding Role")
    created_row = db_session.exec(
        select(JobListing).where(JobListing.id == uuid.UUID(created_without_embedding["id"]))
    ).first()
    assert created_row is not None
    assert created_row.vector_embedding is None

    original_embedding = pickle.dumps(np.array([0.7, 0.2, 0.1]))
    monkeypatch.setattr(
        jobs_queries_module.job_matching_service,
        "generate_and_serialize",
        lambda text: original_embedding,
    )
    created_with_embedding = create_job(client, employer_headers, title="Preserve Embedding Role")
    preserve_row = db_session.exec(
        select(JobListing).where(JobListing.id == uuid.UUID(created_with_embedding["id"]))
    ).first()
    assert preserve_row is not None
    assert preserve_row.vector_embedding == original_embedding

    monkeypatch.setattr(jobs_queries_module.job_matching_service, "generate_and_serialize", lambda text: None)
    update_response = client.patch(
        f"/jobs/{created_with_embedding['id']}",
        headers=employer_headers,
        json={"title": "Preserve Embedding Role Updated"},
    )
    assert update_response.status_code == 200

    db_session.expire_all()
    updated_row = db_session.exec(
        select(JobListing).where(JobListing.id == uuid.UUID(created_with_embedding["id"]))
    ).first()
    assert updated_row is not None
    assert updated_row.vector_embedding == original_embedding


def test_model_info_exposes_semantic_matcher_runtime_health(client, auth_headers, monkeypatch):
    import routers.model_info as model_info_router

    admin_headers = auth_headers("admin")

    monkeypatch.setattr(
        model_info_router.job_matching_service,
        "get_runtime_status",
        lambda: {
            "runtime_available": False,
            "last_load_error": "meta tensor boot failure",
            "last_failure_at": "2026-05-09T00:00:00+00:00",
            "active_device": "cpu",
            "active_backend": "cpu",
            "active_device_name": "CPU",
        },
    )

    response = client.get("/predict/models/info", headers=admin_headers)
    assert response.status_code == 200
    payload = extract_data(assert_standard_response(response.json(), success=True))
    semantic_model = next(model for model in payload["models"] if model["id"] == "semantic_matcher")
    assert semantic_model["runtime_available"] is False
    assert semantic_model["last_load_error"] == "meta tensor boot failure"
    assert semantic_model["active_device"] == "cpu"
    assert "missing_embedding_count" in semantic_model


def test_backfill_job_embeddings_script_updates_missing_rows(client, auth_headers, db_session, test_engine, monkeypatch):
    import scripts.backfill_job_embeddings as backfill_script
    import services.queries.jobs_queries as jobs_queries_module

    employer_headers = auth_headers("employer")

    monkeypatch.setattr(jobs_queries_module.job_matching_service, "generate_and_serialize", lambda text: None)
    created_job = create_job(client, employer_headers, title="Backfill Role")

    backfill_bytes = pickle.dumps(np.array([0.2, 0.8, 0.1]))
    monkeypatch.setattr(backfill_script, "engine", test_engine)
    monkeypatch.setattr(backfill_script.job_matching_service, "load_model", lambda: object())
    monkeypatch.setattr(backfill_script.job_matching_service, "generate_and_serialize", lambda text: backfill_bytes)

    assert backfill_script.main() == 0

    db_session.expire_all()
    row = db_session.exec(select(JobListing).where(JobListing.id == uuid.UUID(created_job["id"]))).first()
    assert row is not None
    assert row.vector_embedding == backfill_bytes


def test_backfill_job_embeddings_script_exits_nonzero_when_model_unavailable(test_engine, monkeypatch):
    import scripts.backfill_job_embeddings as backfill_script

    monkeypatch.setattr(backfill_script, "engine", test_engine)
    monkeypatch.setattr(backfill_script.job_matching_service, "load_model", lambda: None)
    monkeypatch.setattr(
        backfill_script.job_matching_service,
        "get_runtime_status",
        lambda: {
            "runtime_available": False,
            "last_load_error": "meta tensor boot failure",
            "last_failure_at": None,
        },
    )

    assert backfill_script.main() == 1
