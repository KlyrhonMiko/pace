from datetime import datetime, time, timezone

from models.response_codes import StandardResponse, SuccessCode
from schemas.events import EventPublic
from utils.timezone import (
    GMT8,
    SORTABLE_DATETIME_FORMAT,
    convert_to_gmt8,
    format_datetime_gmt8,
)


def test_format_datetime_gmt8_assumes_naive_datetimes_are_utc() -> None:
    naive_utc_datetime = datetime(2026, 3, 8, 0, 30, 45)

    assert format_datetime_gmt8(naive_utc_datetime) == "03/08/2026 - 08:30:45"


def test_convert_to_gmt8_preserves_gmt8_datetimes() -> None:
    gmt8_datetime = datetime(2026, 3, 8, 8, 30, 45, tzinfo=GMT8)

    assert convert_to_gmt8(gmt8_datetime) == gmt8_datetime


def test_standard_response_serializes_timestamp_with_shared_display_format() -> None:
    response = StandardResponse(
        success=True,
        code=SuccessCode.QUESTIONS_RETRIEVED.value,
        message="ok",
        timestamp=datetime(2026, 3, 8, 0, 30, 45, tzinfo=timezone.utc),
    )

    assert response.model_dump(mode="json")["timestamp"] == "03/08/2026 - 08:30:45"


def test_format_datetime_gmt8_supports_sortable_export_format() -> None:
    aware_utc_datetime = datetime(2026, 3, 8, 0, 30, 45, tzinfo=timezone.utc)

    assert (
        format_datetime_gmt8(aware_utc_datetime, fmt=SORTABLE_DATETIME_FORMAT)
        == "2026-03-08 08:30:45"
    )


def test_event_public_keeps_machine_safe_date_and_time_formats() -> None:
    event = EventPublic(
        event_id="EVT-000001",
        event_name="Career Fair",
        description="Campus-wide hiring event",
        event_type="Career Fair",
        date=datetime(2026, 3, 8, 0, 0, 0, tzinfo=timezone.utc),
        time_start=time(9, 15),
        time_end=time(10, 45),
        location="Main Hall",
        capacity=200,
        attendees=120,
        created_at=datetime(2026, 3, 8, 1, 0, 0, tzinfo=timezone.utc),
        updated_at=datetime(2026, 3, 8, 2, 0, 0, tzinfo=timezone.utc),
    )

    payload = event.model_dump(mode="json")

    assert payload["date"] == "2026-03-08"
    assert payload["time_start"] == "09:15"
    assert payload["time_end"] == "10:45"
    assert payload["created_at"] == "03/08/2026 - 09:00:00"
    assert payload["updated_at"] == "03/08/2026 - 10:00:00"
