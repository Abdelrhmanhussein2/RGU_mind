from sqlalchemy.orm import Session
from services.llm_service import llm_service
from controllers.retrieval_controller import retrievall_controller
from schemes.retreival_schemes import retrievalRequest, retrievalResponse, augmentedResponse


class answer_controller:
    def answer(self,request:retrievalRequest, db:Session):
        response=retrievall_controller.retrieval_controller(request, db)

        chunks_for_llm = [source.chunk_text for source in response]
        answer=llm_service.generate_answer(request.query, chunks_for_llm)
        
        return augmentedResponse(
            answer=answer,
            sources=response
        )
        
answer_controllerr=answer_controller()