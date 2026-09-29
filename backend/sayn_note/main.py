"""FastAPI local API for SayNote v0.1."""

from __future__ import annotations

import os
from datetime import date, datetime
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from sayn_note.adapters.storage import RecordStorage
from sayn_note.core.records import CreateRecordRequest, RawFact, Record
from sayn_note.storage.sqlite import SQLiteStorage


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = PROJECT_ROOT / "data" / "saynote.sqlite3"


def create_app(storage: RecordStorage | None = None) -> FastAPI:
    app = FastAPI(
        title="SayNote Local API",
        version="0.1.0",
        description="Local-first Universal Record API. Raw facts remain separate from optional interpretation.",
    )
    app.state.storage = storage or SQLiteStorage(
        os.environ.get("SAYNOTE_DB_PATH", str(DEFAULT_DB_PATH))
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.get("/api/v1/health", tags=["system"])
    def health() -> dict[str, str]:
        return {"status": "ok", "storage": "sqlite"}

    @app.get("/api/v1/capabilities", tags=["system"])
    def capabilities() -> dict[str, list[dict[str, str]]]:
        return {
            "available": [
                {"name": "text_capture", "status": "implemented"},
                {"name": "sqlite_storage", "status": "implemented"},
            ],
            "reserved": [
                {"name": "multimodal_capture", "status": "contract_only"},
                {"name": "search_index", "status": "contract_only"},
                {"name": "memory_engine", "status": "contract_only"},
                {"name": "expense_domain", "status": "contract_only"},
            ],
        }

    @app.post("/api/v1/records", response_model=Record, status_code=201, tags=["records"])
    def create_record(payload: CreateRecordRequest) -> Record:
        now = datetime.now().astimezone()
        record = Record(
            id=uuid4(),
            kind=payload.kind,
            occurred_at=payload.occurred_at or now,
            captured_at=now,
            source=payload.source,
            raw_fact=RawFact(text=payload.content),
            interpretation=None,
            created_at=now,
        )
        return app.state.storage.save_record(record)

    @app.get("/api/v1/records", response_model=list[Record], tags=["records"])
    def list_records(
        record_date: date | None = Query(
            default=None,
            alias="date",
            description="Local calendar date in YYYY-MM-DD format. Defaults to today.",
        )
    ) -> list[Record]:
        target_date = record_date or datetime.now().astimezone().date()
        return list(app.state.storage.list_records_for_date(target_date))

    return app


app = create_app()
