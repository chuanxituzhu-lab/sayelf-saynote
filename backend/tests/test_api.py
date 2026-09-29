from datetime import datetime

from fastapi.testclient import TestClient

from sayn_note.main import create_app
from sayn_note.storage.sqlite import SQLiteStorage


def test_record_round_trip_survives_storage_reopen(tmp_path):
    database = tmp_path / "saynote.sqlite3"
    today = datetime.now().astimezone().date().isoformat()

    first_client = TestClient(create_app(SQLiteStorage(database)))
    response = first_client.post(
        "/api/v1/records",
        json={"content": "在公园记下第一条 SayNote"},
    )

    assert response.status_code == 201
    created = response.json()
    assert created["raw_fact"]["text"] == "在公园记下第一条 SayNote"
    assert created["interpretation"] is None

    first_read = first_client.get(f"/api/v1/records?date={today}")
    assert first_read.status_code == 200
    assert [item["id"] for item in first_read.json()] == [created["id"]]

    reopened_client = TestClient(create_app(SQLiteStorage(database)))
    reopened_read = reopened_client.get(f"/api/v1/records?date={today}")
    assert reopened_read.status_code == 200
    assert reopened_read.json()[0]["raw_fact"]["text"] == "在公园记下第一条 SayNote"


def test_openapi_exposes_same_record_api(tmp_path):
    client = TestClient(create_app(SQLiteStorage(tmp_path / "api.sqlite3")))
    schema = client.get("/openapi.json")

    assert schema.status_code == 200
    assert "/api/v1/records" in schema.json()["paths"]
    assert "post" in schema.json()["paths"]["/api/v1/records"]
    assert "get" in schema.json()["paths"]["/api/v1/records"]
