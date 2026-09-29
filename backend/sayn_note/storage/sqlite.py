"""SQLite persistence for the local-first record core."""

from __future__ import annotations

import json
import sqlite3
from datetime import date, datetime
from pathlib import Path

from sayn_note.core.records import (
    CaptureSource,
    Interpretation,
    RawFact,
    Record,
    RecordKind,
)


SCHEMA = """
CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    captured_at TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS raw_facts (
    record_id TEXT PRIMARY KEY REFERENCES records(id) ON DELETE CASCADE,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interpretations (
    record_id TEXT PRIMARY KEY REFERENCES records(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_records_occurred_at ON records(occurred_at);
"""


class SQLiteStorage:
    """Small replaceable adapter around a single local SQLite file."""

    def __init__(self, db_path: str | Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def initialize(self) -> None:
        with self._connect() as connection:
            connection.executescript(SCHEMA)

    def save_record(self, record: Record) -> Record:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO records (id, kind, occurred_at, captured_at, source, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    str(record.id),
                    record.kind.value,
                    record.occurred_at.isoformat(),
                    record.captured_at.isoformat(),
                    record.source.value,
                    record.created_at.isoformat(),
                ),
            )
            connection.execute(
                "INSERT INTO raw_facts (record_id, content) VALUES (?, ?)",
                (str(record.id), record.raw_fact.text),
            )
            if record.interpretation is not None:
                connection.execute(
                    """
                    INSERT INTO interpretations (record_id, status, payload_json)
                    VALUES (?, ?, ?)
                    """,
                    (
                        str(record.id),
                        record.interpretation.status,
                        json.dumps(record.interpretation.model_dump(mode="json"), ensure_ascii=False),
                    ),
                )
        return record

    def list_records_for_date(self, target_date: date) -> list[Record]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT
                    records.id,
                    records.kind,
                    records.occurred_at,
                    records.captured_at,
                    records.source,
                    records.created_at,
                    raw_facts.content,
                    interpretations.status AS interpretation_status,
                    interpretations.payload_json
                FROM records
                INNER JOIN raw_facts ON raw_facts.record_id = records.id
                LEFT JOIN interpretations ON interpretations.record_id = records.id
                WHERE substr(records.occurred_at, 1, 10) = ?
                ORDER BY records.occurred_at DESC, records.created_at DESC
                """,
                (target_date.isoformat(),),
            ).fetchall()
        return [self._row_to_record(row) for row in rows]

    @staticmethod
    def _row_to_record(row: sqlite3.Row) -> Record:
        interpretation = None
        if row["interpretation_status"] is not None:
            payload = json.loads(row["payload_json"] or "{}")
            interpretation = Interpretation.model_validate(
                {"status": row["interpretation_status"], **payload}
            )
        return Record(
            id=row["id"],
            kind=RecordKind(row["kind"]),
            occurred_at=datetime.fromisoformat(row["occurred_at"]),
            captured_at=datetime.fromisoformat(row["captured_at"]),
            source=CaptureSource(row["source"]),
            raw_fact=RawFact(text=row["content"]),
            interpretation=interpretation,
            created_at=datetime.fromisoformat(row["created_at"]),
        )
