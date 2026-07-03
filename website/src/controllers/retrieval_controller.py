from schemes.retreival_schemes import retrievalRequest, retrievalResponse
from services.embedding_service import embedding_service
from sqlalchemy.orm import Session



class retrieval_controller:
    def retrieval_controller(self, request:retrievalRequest,db:Session):
        result = embedding_service.search(request.query, request.Top_k, request.department_id)


        document_ids = list(set([hit.payload.get("document_id") for hit in result if hit.payload.get("document_id")]))
        doc_map = {}
        if document_ids:
            from models.document_model import Document
            docs = db.query(Document).filter(Document.id.in_(document_ids)).all()
            doc_map = {str(doc.id): doc.filename for doc in docs}

        response=[]
        for hit in result:
            doc_id_str = str(hit.payload.get("document_id"))
            source_document_name = doc_map.get(doc_id_str, doc_id_str)
            
            response.append(
                retrievalResponse(
                    chunk_id=hit.id,
                    similarity_score=hit.score,
                    page_number=str(hit.payload.get("page_ref")),
                    source_document=source_document_name,
                    chunk_text=str(hit.payload.get("content"))
                )
            ) 
        return response




retrievall_controller = retrieval_controller()