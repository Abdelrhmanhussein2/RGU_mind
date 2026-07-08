from sqlalchemy.orm import Session
from services.llm_service import llm_service
from controllers.retrieval_controller import retrievall_controller
from schemes.retreival_schemes import retrievalRequest, retrievalResponse, augmentedResponse


class answer_controller:
    def answer(self,request:retrievalRequest, db:Session, current_user: dict = None):
        from models.chat_model import ChatSession, ChatMessage
        from models.student_profile_model import StudentProfile
        from models.department_model import Department
        from models.faculty_model import Faculty
        from sqlalchemy import func
        import uuid
        from fastapi import HTTPException

        if not request.department_id and current_user:
            user = current_user.get("user")
            role = current_user.get("role")
            
            if role == "student":
                profile = db.query(StudentProfile).filter(StudentProfile.student_id == user.id).first()
                if not profile:
                    raise HTTPException(status_code=400, detail="Student profile not found. Cannot determine department.")
                    
                department = db.query(Department).join(Faculty, Department.faculty_id == Faculty.id).filter(
                    func.lower(Faculty.name) == func.lower(profile.faculty),
                    func.lower(Department.name) == func.lower(profile.department)
                ).first()
                
                if not department:
                    # Fallback: Match by department name only
                    department = db.query(Department).filter(
                        func.lower(Department.name) == func.lower(profile.department)
                    ).first()
                    
                if not department:
                    raise HTTPException(status_code=400, detail=f"Department '{profile.department}' not found for the student's profile.")
                    
                request.department_id = department.id
            else:
                raise HTTPException(status_code=400, detail="department_id is required for non-student users.")


        original_query = request.query
        
        # Handle Chat Session
        session_id = None
        if request.session_id:
            try:
                session_id = uuid.UUID(request.session_id)
            except ValueError:
                pass
        
        chat_session = None
        history = []
        student_id = current_user.get("user").id if current_user else None

        if session_id and student_id:
            chat_session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.student_id == student_id).first()
            if chat_session:
                # Fetch history
                messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
                for msg in messages:
                    history.append({"role": msg.role, "content": msg.content})
        
        if not chat_session and student_id:
            # Create new session
            title = " ".join(original_query.split()[:5]) + "..." if len(original_query.split()) > 5 else original_query
            chat_session = ChatSession(student_id=student_id, title=title)
            db.add(chat_session)
            db.commit()
            db.refresh(chat_session)
            session_id = chat_session.id
        
        # Formulate query for retrieval
        formulated_query = llm_service.formulate_search_query(original_query, history=history)
        request.query = formulated_query
        
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
        answer = llm_service.generate_answer(original_query, chunks_for_llm, department_id=request.department_id, history=history)
        
        # Save Messages
        if chat_session:
            # Save User Message
            user_msg = ChatMessage(session_id=session_id, role="user", content=original_query)
            db.add(user_msg)
            
            # Save Assistant Message
            sources_dict = [{"title": s.source_document, "section": f"Page {s.page_number}"} for s in response]
            asst_msg = ChatMessage(session_id=session_id, role="assistant", content=answer, sources=sources_dict)
            db.add(asst_msg)
            db.commit()

        return augmentedResponse(
            answer=answer,
            sources=response,
            session_id=str(session_id) if session_id else None
        )
        
answer_controllerr=answer_controller()