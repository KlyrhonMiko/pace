import json
import logging
import uuid
import os
from typing import AsyncGenerator

import redis.asyncio as redis_async
from pydantic import BaseModel
from models.notifications import Notification
from schemas.notifications import NotificationResponse

from core.redis import get_redis_client

logger = logging.getLogger(__name__)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
async_redis_client = redis_async.from_url(redis_url, decode_responses=True)

class SSENotificationMessage(BaseModel):
    type: str
    data: NotificationResponse

def publish_notification(user_id: uuid.UUID, notification: Notification) -> None:
    """Publish a notification to the user's personal channel using synchronous Redis."""
    try:
        redis_sync = get_redis_client()
        if not redis_sync:
            logger.warning("Sync Redis client not available for publishing notification.")
            return

        channel = f"notifications:{user_id}"
        message = SSENotificationMessage(
            type="new_notification",
            data=NotificationResponse.model_validate(notification)
        ).model_dump_json()
        
        redis_sync.publish(channel, message)
        logger.debug(f"Published notification to {channel}")
    except Exception as e:
        logger.error(f"Failed to publish notification to redis: {e}")

async def subscribe_notifications(user_id: uuid.UUID) -> AsyncGenerator[str, None]:
    """Yield SSE formatted messages from Redis Pub/Sub for a specific user."""
    pubsub = async_redis_client.pubsub()
    channel = f"notifications:{user_id}"
    await pubsub.subscribe(channel)
    logger.debug(f"Subscribed to {channel}")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                yield f"data: {data}\n\n"
    except Exception as e:
        logger.error(f"SSE subscription error for user {user_id}: {e}")
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
