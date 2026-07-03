import asyncio
from helpers.config import SessionLocal
from models.document_model import Document
from controllers.chunk_controller import ChunkController
from services.embedding_service import embedding_service
from models.chunk_model import Chunk

async def main():
    db = SessionLocal()
    # 1. Clear old chunks from DB
    db.query(Chunk).delete()
    db.commit()
    print("Deleted all chunks from sqlite DB.")

    # 2. Extract and embed chunks for all docs
    chunk_controller = ChunkController()
    from models.regulation_model import Regulation
    docs = db.query(Document).all()
    for doc in docs:
        reg = db.query(Regulation).filter(Regulation.id == doc.regulation_id).first()
        if not reg:
            continue
        dept_id = reg.department_id
        print(f"Processing doc {doc.id} - {doc.filename}")
        # Clear Qdrant collection for this department
        embedding_service.qdrant.delete_collection(collection_name=f"dept_{dept_id}")
        from qdrant_client.http import models
        embedding_service.qdrant.create_collection(
            collection_name=f"dept_{dept_id}",
            vectors_config=models.VectorParams(
                size=1024,
                distance=models.Distance.COSINE
            )
        )
        print(f"Cleared Qdrant collection for dept_{dept_id}")

        await chunk_controller.extract_chunk(doc.id, db)
        print(f"Finished processing doc {doc.id}")

    db.close()
    print("Reprocessing complete!")

if __name__ == '__main__':
    asyncio.run(main())
