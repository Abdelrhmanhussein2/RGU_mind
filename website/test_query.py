import sys
import os

# Add src to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.embedding_service import embedding_service
from services.llm_service import llm_service
from models.department_model import Department
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///src/mind.db")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def main():
    db = SessionLocal()
    # Let's get the first department id just for testing
    dept = db.query(Department).first()
    if not dept:
        print("No department found")
        return
        
    query = "مشروع التخرج CCE 491"
    print(f"Testing query: {query} with department {dept.id}")
    
    # 1. Test embedding retrieval
    results = embedding_service.search(query, top_k=5, department_id=dept.id)
    print(f"\nQdrant returned {len(results)} chunks")
    
    chunks_for_llm = []
    for i, res in enumerate(results):
        text = res.payload.get('content')
        score = res.score
        print(f"--- Chunk {i+1} (Score: {score}) ---")
        try:
            print(text[:100] + "...")
        except UnicodeEncodeError:
            pass
        chunks_for_llm.append(f"[رقم الشانك: {res.id}]\n{text}")
        
    # 2. Test LLM if we have chunks
    if chunks_for_llm:
        print("\nTesting LLM generation...")
        answer = llm_service.generate_answer(query, chunks_for_llm)
        print("LLM Answer:")
        try:
            print(answer)
        except UnicodeEncodeError:
            print(answer.encode('utf-8', errors='replace').decode('cp1252', errors='ignore'))
    else:
        print("\nNo chunks for LLM")

if __name__ == '__main__':
    main()
