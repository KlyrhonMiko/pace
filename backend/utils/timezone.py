from datetime import datetime, timezone, timedelta

# GMT+8 timezone (Philippine Standard Time)
GMT8 = timezone(timedelta(hours=8))


def get_current_time_gmt8() -> datetime:
    """Get current time in GMT+8 timezone"""
    return datetime.now(GMT8)


def convert_to_gmt8(dt: datetime) -> datetime:
    """Convert any datetime to GMT+8 timezone"""
    if dt is None:
        return None
    
    # If naive datetime, assume it's UTC and localize it
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    # Convert to GMT+8
    return dt.astimezone(GMT8)


__all__ = ['GMT8', 'get_current_time_gmt8', 'convert_to_gmt8']
