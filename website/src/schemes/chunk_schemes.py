from typing import Optional
from helpers.enums import UserType
from pydantic import BaseModel
from uuid import UUID


class ChunkResponse(BaseModel):
    chunk_id: UUID
    source: str
    page: int
    content: str

