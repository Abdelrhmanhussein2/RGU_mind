from pydantic import BaseModel
from uuid import UUID


class EmbeddingRequest(BaseModel):
    text: str
    chunk_id: UUID