from pydantic import BaseModel, Field
from uuid import UUID

class retrievalRequest(BaseModel):
    query: str
    Top_k:int=5
    department_id:UUID


class retrievalResponse(BaseModel):
    chunk_id:str
    similarity_score:float
    page_number:str
    source_document:str
    chunk_text:str

class retrievalListResponse(BaseModel):
    message: str
    data: list[retrievalResponse]
