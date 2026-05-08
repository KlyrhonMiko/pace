import pickle
import uuid
from typing import List, Dict, Tuple
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:
    SentenceTransformer = None
    cosine_similarity = None


class JobMatchingService:
    def __init__(self):
        # Initialize the model conditionally so it doesn't crash if not installed yet
        self._model = None

    @property
    def model(self):
        if self._model is None and SentenceTransformer is not None:
            # Loads the all-MiniLM-L6-v2 model upon first use
            self._model = SentenceTransformer('all-MiniLM-L6-v2')
        return self._model

    def generate_embedding(self, text: str) -> np.ndarray:
        if not text or not text.strip() or self.model is None:
            return np.zeros(384) # all-MiniLM-L6-v2 has dimension 384
        return self.model.encode(text)

    def serialize_embedding(self, embedding: np.ndarray) -> bytes:
        return pickle.dumps(embedding)

    def deserialize_embedding(self, embedding_bytes: bytes) -> np.ndarray:
        return pickle.loads(embedding_bytes)
        
    def generate_and_serialize(self, text: str) -> bytes:
        return self.serialize_embedding(self.generate_embedding(text))

    def calculate_similarity(
        self, 
        alumni_skills: str, 
        job_embeddings: List[Tuple[uuid.UUID, bytes, str, str]]
    ) -> List[Dict]:
        """
        Calculate cosine similarity between alumni skills and job embeddings.
        
        Args:
            alumni_skills: String representation of alumni skills
            job_embeddings: List of tuples containing (job_id, embedding_bytes, title, company)
            
        Returns:
            List of dictionaries with matching jobs sorted by similarity score
        """
        if not alumni_skills or not job_embeddings or self.model is None:
            return []
            
        alumni_vector = self.generate_embedding(alumni_skills)
        
        results = []
        for job_id, emb_bytes, title, company in job_embeddings:
            try:
                job_vector = self.deserialize_embedding(emb_bytes)
                # cosine_similarity expects 2D arrays
                score = cosine_similarity([alumni_vector], [job_vector])[0][0]
                
                # Raw cosine similarity for dense embeddings (like all-MiniLM-L6-v2) 
                # typically hovers around 0.3 - 0.6 for strong semantic matches.
                # A raw score of 0.45 is actually a very good match!
                # We normalize it to make it look like an intuitive 0-100% scale for users.
                
                # 1. Shift from [-1, 1] to [0, 1]
                normalized = (score + 1.0) / 2.0
                
                # 2. Apply a slight curve to push typical good matches (0.7-0.8 normalized) 
                # higher, capped at 1.0 (100%)
                boosted = min(1.0, normalized * 1.25)
                
                results.append({
                    "job_id": str(job_id),
                    "title": title,
                    "company": company,
                    "similarity_score": float(score),
                    "match_percentage": round(float(boosted) * 100, 2)
                })
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to process embedding for job {job_id}: {e}")
                continue
            
        # Sort by similarity score descending
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results

# Singleton instance
job_matching_service = JobMatchingService()
