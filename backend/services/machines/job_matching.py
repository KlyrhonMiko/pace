import logging
import pickle
import threading
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import numpy as np

from utils.timezone import get_current_time_utc

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:
    SentenceTransformer = None
    cosine_similarity = None

try:
    import torch
except ImportError:
    torch = None


logger = logging.getLogger(__name__)


class JobMatchingService:
    MODEL_NAME = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSIONS = 384

    def __init__(self):
        self._model = None
        self._model_lock = threading.Lock()
        self._last_load_error: Optional[str] = None
        self._last_failure_at: Optional[datetime] = None
        self._active_device = "cpu"
        self._active_backend = "cpu"
        self._active_device_name = "CPU"

    @property
    def model(self):
        return self.load_model()

    def load_model(self):
        if self._model is not None:
            return self._model

        if SentenceTransformer is None:
            self._record_load_failure("sentence-transformers is not installed")
            return None

        with self._model_lock:
            if self._model is not None:
                return self._model

            errors: list[tuple[str, str, str]] = []
            for device, backend, device_name in self._get_device_candidates():
                try:
                    self._model = SentenceTransformer(self.MODEL_NAME, device=device)
                    self._active_device = device
                    self._active_backend = backend
                    self._active_device_name = device_name
                    self._last_load_error = None
                    self._last_failure_at = None
                    logger.info(
                        "Initialized semantic job matching model on device=%s backend=%s device_name=%s",
                        device,
                        backend,
                        device_name,
                    )
                    break
                except Exception as exc:
                    self._model = None
                    errors.append((device, backend, str(exc)))
                    logger.exception(
                        "Failed to initialize semantic job matching model on device=%s backend=%s",
                        device,
                        backend,
                    )

            if self._model is None:
                if not errors:
                    self._record_load_failure("model initialization failed")
                elif len(errors) == 1:
                    self._record_load_failure(errors[0][2])
                else:
                    self._record_load_failure(
                        "; ".join(f"{device} ({backend}): {message}" for device, backend, message in errors)
                    )

        return self._model

    def _record_load_failure(self, message: str) -> None:
        self._last_load_error = message
        self._last_failure_at = get_current_time_utc()

    def _reset_model(self) -> None:
        self._model = None

    def _get_device_candidates(self) -> List[Tuple[str, str, str]]:
        candidates: List[Tuple[str, str, str]] = []

        if torch is not None and hasattr(torch, "cuda") and torch.cuda.is_available():
            backend = "rocm" if getattr(getattr(torch, "version", None), "hip", None) else "cuda"
            device_name = "GPU"
            try:
                device_name = torch.cuda.get_device_name(torch.cuda.current_device())
            except Exception:
                pass
            candidates.append(("cuda", backend, device_name))

        candidates.append(("cpu", "cpu", "CPU"))
        return candidates

    def _load_model_on_device(self, device: str, backend: str, device_name: str):
        if SentenceTransformer is None:
            self._record_load_failure("sentence-transformers is not installed")
            return None

        with self._model_lock:
            try:
                self._model = SentenceTransformer(self.MODEL_NAME, device=device)
                self._active_device = device
                self._active_backend = backend
                self._active_device_name = device_name
                self._last_load_error = None
                self._last_failure_at = None
                logger.info(
                    "Reinitialized semantic job matching model on device=%s backend=%s device_name=%s",
                    device,
                    backend,
                    device_name,
                )
                return self._model
            except Exception as exc:
                self._model = None
                self._record_load_failure(f"{device} ({backend}): {exc}")
                logger.exception(
                    "Failed to reinitialize semantic job matching model on device=%s backend=%s",
                    device,
                    backend,
                )
                return None

    def _retry_generate_embedding_on_cpu(self, text: str) -> Optional[np.ndarray]:
        cpu_model = self._load_model_on_device("cpu", "cpu", "CPU")
        if cpu_model is None:
            return None

        try:
            return np.asarray(cpu_model.encode(text))
        except Exception as exc:
            self._record_load_failure(f"cpu encode failed: {exc}")
            logger.exception("Failed to generate semantic embedding on CPU fallback")
            return None

    def get_runtime_status(self) -> dict:
        return {
            "runtime_available": self._model is not None,
            "last_load_error": self._last_load_error,
            "last_failure_at": self._last_failure_at.isoformat() if self._last_failure_at else None,
            "active_device": self._active_device,
            "active_backend": self._active_backend,
            "active_device_name": self._active_device_name,
        }

    def generate_embedding(self, text: str) -> Optional[np.ndarray]:
        if not text or not text.strip():
            return None

        model = self.load_model()
        if model is None:
            return None

        try:
            return np.asarray(model.encode(text))
        except Exception as exc:
            self._record_load_failure(str(exc))
            logger.exception(
                "Failed to generate semantic embedding on device=%s backend=%s",
                self._active_device,
                self._active_backend,
            )
            if self._active_device != "cpu":
                self._reset_model()
                return self._retry_generate_embedding_on_cpu(text)
            return None

    def serialize_embedding(self, embedding: np.ndarray) -> bytes:
        return pickle.dumps(embedding)

    def deserialize_embedding(self, embedding_bytes: bytes) -> np.ndarray:
        return pickle.loads(embedding_bytes)

    def generate_and_serialize(self, text: str) -> Optional[bytes]:
        embedding = self.generate_embedding(text)
        if embedding is None:
            return None
        return self.serialize_embedding(embedding)

    def calculate_similarity(
        self,
        alumni_skills: str,
        job_embeddings: List[Tuple[uuid.UUID, bytes, str, str]],
    ) -> List[Dict]:
        """
        Calculate cosine similarity between alumni skills and job embeddings.
        """
        if not alumni_skills or not job_embeddings or cosine_similarity is None:
            return []

        model = self.load_model()
        if model is None:
            logger.warning(
                "Semantic job matching unavailable; returning no matches. last_load_error=%s",
                self._last_load_error,
            )
            return []

        alumni_vector = self.generate_embedding(alumni_skills)
        if alumni_vector is None:
            return []

        results = []
        for job_id, emb_bytes, title, company in job_embeddings:
            try:
                job_vector = self.deserialize_embedding(emb_bytes)
                score = cosine_similarity([alumni_vector], [job_vector])[0][0]

                baseline = 0.38
                max_expected = 0.52

                if score < baseline:
                    match_percentage = 0.0
                else:
                    effective_score = min(score, max_expected)
                    scaled = (effective_score - baseline) / (max_expected - baseline)
                    smooth = (scaled ** 2) * (3.0 - 2.0 * scaled)
                    match_percentage = round(float(smooth) * 100, 2)

                results.append(
                    {
                        "job_id": str(job_id),
                        "title": title,
                        "company": company,
                        "similarity_score": float(score),
                        "match_percentage": match_percentage,
                    }
                )
            except Exception as exc:
                logger.error("Failed to process embedding for job %s: %s", job_id, exc)
                continue

        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results


job_matching_service = JobMatchingService()
