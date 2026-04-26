from __future__ import annotations

from typing import Any


def assert_standard_response(
    payload: dict[str, Any],
    *,
    success: bool | None = None,
    code: str | None = None,
    message_contains: str | None = None,
) -> dict[str, Any]:
    assert "success" in payload
    assert "code" in payload
    assert "message" in payload
    if success is not None:
        assert payload["success"] is success
    if code is not None:
        assert payload["code"] == code
    if message_contains is not None:
        assert message_contains.lower() in payload["message"].lower()
    return payload


def assert_paginated_payload(payload: dict[str, Any]) -> dict[str, Any]:
    assert "success" in payload
    assert "code" in payload
    assert "message" in payload
    assert "data" in payload
    assert "pagination" in payload
    return payload


def extract_data(response_json: dict[str, Any]) -> Any:
    assert "data" in response_json
    return response_json["data"]


def audit_fields_present(data: dict[str, Any]) -> None:
    assert "created_by" in data
    assert "is_deleted" in data
    assert "deleted_at" in data
    assert "deleted_by" in data

