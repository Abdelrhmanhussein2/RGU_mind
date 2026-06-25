from schemes.retreival_schemes import retrievalRequest, retrievalResponse
from services.embedding_service import embedding_service
from sqlalchemy.orm import Session



class retrieval_controller:
    def retrieval_controller(self, request:retrievalRequest,db:Session):
        result = embedding_service.search(request.query, request.Top_k, request.department_id)


        response=[]

        for hit in result:
            response.append(
                retrievalResponse(
                    chunk_id=hit.id,
                    similarity_score=hit.score,
                    page_number=str(hit.payload.get("page_ref")),
                    source_document=str(hit.payload.get("document_id")),
                    chunk_text=str(hit.payload.get("content"))
                )
            ) 
        return response




retrievall_controller = retrieval_controller()