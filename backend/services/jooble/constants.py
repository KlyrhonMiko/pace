from core.config import settings

JOOBLE_API_URL = f"https://jooble.org/api/{settings.JOOBLE_API_KEY}"
JOOBLE_BATCH_SIZE = 100  # Per-page batch size (10 pages = 1000 jobs)
MAX_SYNC_PAGES = 3  # Maximum Jooble pages fetched synchronously per interactive request (300 jobs)
MAX_SYNC_ITEMS = MAX_SYNC_PAGES * JOOBLE_BATCH_SIZE  # 300 jobs max per interactive request
