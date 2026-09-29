"""Storage port used by the API layer."""

from collections.abc import Sequence
from datetime import date
from typing import Protocol

from sayn_note.core.records import Record


class RecordStorage(Protocol):
    def save_record(self, record: Record) -> Record: ...

    def list_records_for_date(self, target_date: date) -> Sequence[Record]: ...
