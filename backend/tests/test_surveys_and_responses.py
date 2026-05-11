from tests.api_helpers import create_question, create_survey
from tests.helpers import assert_standard_response, extract_data


def test_survey_lifecycle_question_management_and_responses(client, auth_headers):
    staff_headers = auth_headers("staff")
    alumni_headers = auth_headers("alumni")

    template = client.post("/surveys/templates/tracer-study", headers=staff_headers)
    assert template.status_code in {201, 409}

    survey = create_survey(client, staff_headers)
    survey_id = survey["survey_id"]

    surveys_list = client.get("/surveys", headers=staff_headers)
    assert surveys_list.status_code == 200
    assert_standard_response(surveys_list.json(), success=True)

    survey_detail = client.get(f"/surveys/{survey_id}", headers=staff_headers)
    assert survey_detail.status_code == 200
    assert extract_data(assert_standard_response(survey_detail.json(), success=True))["survey_id"] == survey_id

    updated = client.patch(
        f"/surveys/{survey_id}",
        headers=staff_headers,
        json={"description": "Updated survey description"},
    )
    assert updated.status_code == 200
    assert_standard_response(updated.json(), success=True)

    question = create_question(client, staff_headers)
    question_id = question["question_id"]

    add_question = client.post(
        f"/surveys/{survey_id}/questions",
        headers=staff_headers,
        json={"question_id": question_id},
    )
    assert add_question.status_code == 201
    assert_standard_response(add_question.json(), success=True)

    batch_add = client.post(
        f"/surveys/{survey_id}/questions/batch",
        headers=staff_headers,
        json=[{"question_id": question_id}],
    )
    assert batch_add.status_code == 201
    assert batch_add.json()["success"] is False

    question_listing = client.get(f"/surveys/{survey_id}/questions", headers=staff_headers)
    assert question_listing.status_code == 200
    assert_standard_response(question_listing.json(), success=True)

    publish = client.post(f"/surveys/{survey_id}/publish", headers=staff_headers)
    assert publish.status_code == 200
    publish_payload = extract_data(assert_standard_response(publish.json(), success=True))
    assert publish_payload["status"] == "ACTIVE"

    alumni_visible = client.get("/alumni/surveys", headers=alumni_headers)
    assert alumni_visible.status_code == 200
    assert_standard_response(alumni_visible.json(), success=True)

    alumni_detail = client.get(f"/alumni/surveys/{survey_id}", headers=alumni_headers)
    assert alumni_detail.status_code == 200
    assert extract_data(assert_standard_response(alumni_detail.json(), success=True))["survey_id"] == survey_id

    respond = client.post(
        f"/surveys/{survey_id}/respond",
        headers=alumni_headers,
        json={
            "alumni_id": "ALMN-000001",
            "answers": [{"question_id": question_id, "answer_bool": True}],
        },
    )
    assert respond.status_code == 201
    assert_standard_response(respond.json(), success=True)

    duplicate = client.post(
        f"/surveys/{survey_id}/respond",
        headers=alumni_headers,
        json={
            "alumni_id": "ALMN-000001",
            "answers": [{"question_id": question_id, "answer_bool": True}],
        },
    )
    assert duplicate.status_code == 409
    assert_standard_response(duplicate.json(), success=False)

    responded = client.get("/alumni/me/responded-surveys", headers=alumni_headers)
    assert responded.status_code == 200
    responded_payload = extract_data(assert_standard_response(responded.json(), success=True))
    assert survey_id in responded_payload["responded_survey_ids"]

    results = client.get(f"/surveys/{survey_id}/results", headers=staff_headers)
    assert results.status_code == 200
    assert_standard_response(results.json(), success=True)

    export = client.get(f"/surveys/{survey_id}/export", headers=staff_headers)
    assert export.status_code == 200
    assert_standard_response(export.json(), success=True)

    close = client.post(f"/surveys/{survey_id}/close", headers=staff_headers)
    assert close.status_code == 200
    assert extract_data(assert_standard_response(close.json(), success=True))["status"] == "CLOSED"

    reopen = client.post(f"/surveys/{survey_id}/reopen", headers=staff_headers)
    assert reopen.status_code == 200
    assert extract_data(assert_standard_response(reopen.json(), success=True))["status"] == "ACTIVE"

    close_again = client.post(f"/surveys/{survey_id}/close", headers=staff_headers)
    assert close_again.status_code == 200
    archive = client.post(f"/surveys/{survey_id}/archive", headers=staff_headers)
    assert archive.status_code == 200
    assert extract_data(assert_standard_response(archive.json(), success=True))["status"] == "ARCHIVED"

    deleted = client.delete(f"/surveys/{survey_id}", headers=staff_headers)
    assert deleted.status_code == 200
    assert_standard_response(deleted.json(), success=True)

    restored = client.post(f"/surveys/{survey_id}/restore", headers=staff_headers)
    assert restored.status_code == 200
    assert_standard_response(restored.json(), success=True)


def test_survey_question_remove_and_reorder(client, auth_headers):
    staff_headers = auth_headers("staff")
    survey = create_survey(client, staff_headers, title="Question Order Survey")
    question_one = create_question(client, staff_headers, text="Question one?")
    question_two = create_question(client, staff_headers, text="Question two?")

    client.post(
        f"/surveys/{survey['survey_id']}/questions",
        headers=staff_headers,
        json={"question_id": question_one["question_id"], "order_index": 1},
    )
    client.post(
        f"/surveys/{survey['survey_id']}/questions",
        headers=staff_headers,
        json={"question_id": question_two["question_id"], "order_index": 2},
    )

    reorder = client.patch(
        f"/surveys/{survey['survey_id']}/questions/reorder",
        headers=staff_headers,
        json={"order_map": {question_one["question_id"]: 2, question_two["question_id"]: 1}},
    )
    assert reorder.status_code == 200
    assert_standard_response(reorder.json(), success=True)

    remove = client.delete(
        f"/surveys/{survey['survey_id']}/questions/{question_one['question_id']}",
        headers=staff_headers,
    )
    assert remove.status_code == 200
    assert_standard_response(remove.json(), success=True)


def test_alumni_survey_history_includes_archived_and_deleted_surveys(client, auth_headers):
    staff_headers = auth_headers("staff")
    alumni_headers = auth_headers("alumni")

    survey = create_survey(client, staff_headers, title="History Survey")
    survey_id = survey["survey_id"]
    question = create_question(client, staff_headers, text="History question?")
    question_id = question["question_id"]

    add_question = client.post(
        f"/surveys/{survey_id}/questions",
        headers=staff_headers,
        json={"question_id": question_id},
    )
    assert add_question.status_code == 201

    publish = client.post(f"/surveys/{survey_id}/publish", headers=staff_headers)
    assert publish.status_code == 200

    respond = client.post(
        f"/surveys/{survey_id}/respond",
        headers=alumni_headers,
        json={
            "alumni_id": "ALMN-000001",
            "answers": [{"question_id": question_id, "answer_bool": True}],
        },
    )
    assert respond.status_code == 201

    close_again = client.post(f"/surveys/{survey_id}/close", headers=staff_headers)
    assert close_again.status_code == 200
    archive = client.post(f"/surveys/{survey_id}/archive", headers=staff_headers)
    assert archive.status_code == 200
    deleted = client.delete(f"/surveys/{survey_id}", headers=staff_headers)
    assert deleted.status_code == 200

    history = client.get("/alumni/me/survey-history", headers=alumni_headers)
    assert history.status_code == 200
    history_payload = extract_data(assert_standard_response(history.json(), success=True))
    survey_item = next(item for item in history_payload["surveys"] if item["survey_id"] == survey_id)
    assert survey_item["status"] == "ARCHIVED"
    assert survey_item["is_deleted"] is True

    history_detail = client.get(f"/alumni/surveys/{survey_id}/history-detail", headers=alumni_headers)
    assert history_detail.status_code == 200
    history_detail_payload = extract_data(assert_standard_response(history_detail.json(), success=True))
    assert history_detail_payload["survey_id"] == survey_id
    assert history_detail_payload["is_deleted"] is True
    assert len(history_detail_payload["questions"]) == 1
