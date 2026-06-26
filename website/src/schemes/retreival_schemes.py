from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional

class retrievalRequest(BaseModel):
    query: str
    Top_k:int=5
    department_id: Optional[UUID] = None


class retrievalResponse(BaseModel):
    chunk_id:str
    similarity_score:float
    page_number:str
    source_document:str
    chunk_text:str

class retrievalListResponse(BaseModel):
    message: str
    data: list[retrievalResponse]

class augmentedResponse(BaseModel):
    answer: str
    sources: list[retrievalResponse]

class augmentedListResponse(BaseModel):
    message: str
    data: augmentedResponse
