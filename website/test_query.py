import sys
import os

# Add src to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.embedding_service import embedding_service
from services.llm_service import llm_service
from models.department_model import Department
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import os
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    DB_URL = "postgresql://postgres:postgres@localhost:5432/rgu_mind"

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def main():
    db = SessionLocal()
    # Let's get the first department id just for testing
    dept = db.query(Department).first()
    if not dept:
        print("No department found")
        return
        
    original_query = "الخريف"
    history = [
        {"role": "user", "content": "انا مستوي صفري عايز اعرف اي المواد المتاحه للتسجيل؟"},
        {"role": "assistant", "content": "هل تقصد مقررات فصل الخريف أم فصل الربيع؟"}
    ]
    
    print(f"Testing query with history...")
    formulated_query = llm_service.formulate_search_query(original_query, history=history)
    print(f"Formulated Query: {formulated_query}")
    
    # 1. Test embedding retrieval
    results = embedding_service.search(formulated_query, top_k=5, department_id=dept.id)
    print(f"\nQdrant returned {len(results)} chunks")
    
    chunks_for_llm = []
    for i, res in enumerate(results):
        text = res.payload.get('content')
        score = res.score
        print(f"\n--- Chunk {i+1} (Score: {score}) ---")
        try:
            print(text)
        except UnicodeEncodeError:
            print(text.encode('utf-8', errors='replace').decode('cp1252', errors='ignore'))
        chunks_for_llm.append(f"[رقم الشانك: {res.id}]\n{text}")
        
    # 2. Test LLM if we have chunks
    if chunks_for_llm:
        print("\nTesting LLM generation...")
        answer = llm_service.generate_answer(original_query, chunks_for_llm, department_id=dept.id, history=history)
        print("LLM Answer:")
        try:
            print(answer)
        except UnicodeEncodeError:
            print(answer.encode('utf-8', errors='replace').decode('cp1252', errors='ignore'))
    else:
        print("\nNo chunks for LLM")

if __name__ == '__main__':
    main()
