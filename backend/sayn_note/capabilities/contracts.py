"""Optional capability ports.

These are contracts only. v0.1 deliberately provides no multimodal, search,
memory, or expense implementation behind them.
"""

from typing import Protocol

from sayn_note.core.records import Record


class CaptureAdapter(Protocol):
    def capture(self, payload: object) -> Record: ...


class SearchIndex(Protocol):
    def search(self, query: str) -> list[Record]: ...


class MemoryEngine(Protocol):
    def interpret(self, record: Record) -> Record: ...


class ExpenseDomain(Protocol):
    def classify(self, record: Record) -> Record: ...
