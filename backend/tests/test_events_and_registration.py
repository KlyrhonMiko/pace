import io

from sqlmodel import select

from models.events import Event, EventRegistration
from tests.api_helpers import create_event, create_event_type
from tests.helpers import assert_standard_response, extract_data


def test_event_crud_image_and_registration_flow(client, auth_headers, db_session):
    staff_headers = auth_headers("staff")
    alumni_headers = auth_headers("alumni")

    event_type = create_event_type(client, auth_headers("admin"))
    event = create_event(client, staff_headers, event_type_name=event_type["event_name"])
    event_id = event["event_id"]

    listing = client.get("/events", headers=alumni_headers)
    assert listing.status_code == 200
    assert_standard_response(listing.json(), success=True)

    detail = client.get(f"/events/{event_id}", headers=alumni_headers)
    assert detail.status_code == 200
    assert extract_data(assert_standard_response(detail.json(), success=True))["event_id"] == event_id

    patched = client.patch(
        f"/events/{event_id}",
        headers=staff_headers,
        json={"location": "Updated Hall"},
    )
    assert patched.status_code == 200
    assert extract_data(assert_standard_response(patched.json(), success=True))["location"] == "Updated Hall"

    upload = client.post(
        f"/events/{event_id}/upload-image",
        headers=staff_headers,
        files={"file": ("banner.png", io.BytesIO(b"banner"), "image/png")},
    )
    assert upload.status_code == 200
    assert_standard_response(upload.json(), success=True)

    image_url = client.get(f"/events/{event_id}/image-url", headers=alumni_headers)
    assert image_url.status_code == 200
    assert_standard_response(image_url.json(), success=True)

    register = client.post(f"/events/{event_id}/register", headers=alumni_headers)
    assert register.status_code == 200
    assert_standard_response(register.json(), success=True)

    duplicate_register = client.post(f"/events/{event_id}/register", headers=alumni_headers)
    assert duplicate_register.status_code == 409
    assert_standard_response(duplicate_register.json(), success=False)

    registrants = client.get(f"/events/{event_id}/registrants", headers=staff_headers)
    assert registrants.status_code == 200
    assert_standard_response(registrants.json(), success=True)

    unregister = client.delete(f"/events/{event_id}/unregister", headers=alumni_headers)
    assert unregister.status_code == 200
    assert_standard_response(unregister.json(), success=True)

    delete_image = client.delete(f"/events/{event_id}/delete-image", headers=staff_headers)
    assert delete_image.status_code == 200
    assert_standard_response(delete_image.json(), success=True)

    deleted = client.delete(f"/events/{event_id}", headers=staff_headers)
    assert deleted.status_code == 200
    assert_standard_response(deleted.json(), success=True)

    db_session.expire_all()
    event_row = db_session.exec(select(Event).where(Event.event_id == event_id)).first()
    registration_row = db_session.exec(select(EventRegistration).where(EventRegistration.event_ref_id == event_row.id)).first() if event_row else None
    assert event_row is not None and event_row.is_deleted is True
    assert registration_row is not None and registration_row.is_deleted is True

    restored = client.post(f"/events/{event_id}/restore", headers=staff_headers)
    assert restored.status_code == 200
    assert_standard_response(restored.json(), success=True)
