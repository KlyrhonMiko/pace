from datetime import date, datetime, time, timezone, timedelta
from typing import Optional

# GMT+8 timezone (Philippine Standard Time)
GMT8 = timezone(timedelta(hours=8))
DATETIME_DISPLAY_FORMAT = "%m/%d/%Y - %H:%M:%S"
SORTABLE_DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"
DATE_DISPLAY_FORMAT = "%Y-%m-%d"
TIME_DISPLAY_FORMAT = "%H:%M"


def ensure_aware_datetime(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure a datetime is timezone-aware, assuming naive values are UTC."""
    if dt is None:
        return None

    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)

    return dt


def ensure_aware_gmt8(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure a datetime is timezone-aware, assuming naive values are GMT+8."""
    if dt is None:
        return None

    if dt.tzinfo is None:
        return dt.replace(tzinfo=GMT8)

    return dt


def get_current_time_gmt8() -> datetime:
    """Get current time in GMT+8 timezone"""
    return datetime.now(GMT8)


def get_current_time_utc() -> datetime:
    """Get current time in UTC."""
    return datetime.now(timezone.utc)


def get_current_year_gmt8() -> int:
    """Get the current year in GMT+8."""
    return get_current_time_gmt8().year


def convert_to_gmt8(dt: Optional[datetime]) -> Optional[datetime]:
    """Convert any datetime to GMT+8 timezone"""
    aware_datetime = ensure_aware_datetime(dt)
    if aware_datetime is None:
        return None

    return aware_datetime.astimezone(GMT8)


def format_datetime_gmt8(
    dt: Optional[datetime], fmt: str = DATETIME_DISPLAY_FORMAT
) -> Optional[str]:
    """Convert a datetime to GMT+8 and format it for display."""
    gmt8_datetime = convert_to_gmt8(dt)
    if gmt8_datetime is None:
        return None

    return gmt8_datetime.replace(microsecond=0).strftime(fmt)


def format_date_gmt8(
    dt: Optional[datetime], fmt: str = DATE_DISPLAY_FORMAT
) -> Optional[str]:
    """Convert a datetime to GMT+8 and format only the date portion."""
    gmt8_datetime = convert_to_gmt8(dt)
    if gmt8_datetime is None:
        return None

    return gmt8_datetime.strftime(fmt)


def format_date_value(value: Optional[date], fmt: str = DATE_DISPLAY_FORMAT) -> Optional[str]:
    """Format a date value without changing its calendar date."""
    if value is None:
        return None

    return value.strftime(fmt)


def format_time_value(value: Optional[time], fmt: str = TIME_DISPLAY_FORMAT) -> Optional[str]:
    """Format a time value for display."""
    if value is None:
        return None

    return value.strftime(fmt)


__all__ = [
    "GMT8",
    "DATETIME_DISPLAY_FORMAT",
    "SORTABLE_DATETIME_FORMAT",
    "DATE_DISPLAY_FORMAT",
    "TIME_DISPLAY_FORMAT",
    "ensure_aware_datetime",
    "ensure_aware_gmt8",
    "get_current_time_gmt8",
    "get_current_time_utc",
    "get_current_year_gmt8",
    "convert_to_gmt8",
    "format_datetime_gmt8",
    "format_date_gmt8",
    "format_date_value",
    "format_time_value",
]
