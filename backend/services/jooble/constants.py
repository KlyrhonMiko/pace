from core.config import settings

JOOBLE_API_URL = f"https://jooble.org/api/{settings.JOOBLE_API_KEY}"
JOOBLE_BATCH_SIZE = 100  # Per-page batch size (10 pages = 1000 jobs)
