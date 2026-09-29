"""Universal Record domain contract.

The raw fact is intentionally separate from interpretation. A future memory
engine may add an interpretation, but it must never replace the captured fact.
"""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RecordKind(str, Enum):
    TEXT = "text"
    VOICE = "voice"
    IMAGE = "image"
    DRAWING = "drawing"
    VIDEO = "video"
    FILE = "file"


class CaptureSource(str, Enum):
    MANUAL = "manual"
    IMPORT = "import"
    SYSTEM = "system"


class RawFact(BaseModel):
    text: str = Field(min_length=1, max_length=10_000)


class Interpretation(BaseModel):
    status: str = "unprocessed"
    labels: list[str] = Field(default_factory=list)
    summary: str | None = None


class Record(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    kind: RecordKind
    occurred_at: datetime
    captured_at: datetime
    source: CaptureSource
    raw_fact: RawFact
    interpretation: Interpretation | None = None
    created_at: datetime


class CreateRecordRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10_000)
    kind: RecordKind = RecordKind.TEXT
    occurred_at: datetime | None = None
    source: CaptureSource = CaptureSource.MANUAL

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("content must not be blank")
        return value
