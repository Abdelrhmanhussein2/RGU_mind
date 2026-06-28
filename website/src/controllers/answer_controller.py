from sqlalchemy.orm import Session
from services.llm_service import llm_service
from controllers.retrieval_controller import retrievall_controller
from schemes.retreival_schemes import retrievalRequest, retrievalResponse, augmentedResponse


class answer_controller:
    def answer(self,request:retrievalRequest, db:Session):
        response=retrievall_controller.retrieval_controller(request, db)

        print("\n\n====== DEBUG: RETRIEVED CHUNKS FROM QDRANT ======")
        for i, source in enumerate(response):
            print(f"--- Source {i+1} | Chunk ID: {source.chunk_id} ---")
            try:
                print(source.chunk_text)
            except UnicodeEncodeError:
                print(source.chunk_text.encode('utf-8', errors='replace').decode('cp1252', errors='ignore'))
            print("-------------------------------------------------")
        print("=================================================\n\n")

        chunks_for_llm = [f"[رقم الشانك: {source.chunk_id}]\n{source.chunk_text}" for source in response]
        answer=llm_service.generate_answer(request.query, chunks_for_llm)
        
        return augmentedResponse(
            answer=answer,
            sources=response
        )
        
answer_controllerr=answer_controller()