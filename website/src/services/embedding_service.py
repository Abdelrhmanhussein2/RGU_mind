from sqlalchemy.orm import Session
from uuid import UUID
from cohere import Client
from helpers.config import COHERE_API_KEY, QDRANT_API_KEY, QDRANT_URL
import qdrant_client
from qdrant_client.models import VectorParams, PointStruct, Distance, Filter, FieldCondition, MatchAny, PayloadSchemaType

from models.chunk_model import Chunk
from models.document_model import Document
from models.regulation_model import Regulation


class EmbeddingService:
    def __init__(self):
        self.co = Client(api_key=COHERE_API_KEY)
        self.qdrant = qdrant_client.QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
            timeout=60.0
        )
        self.collection_name = "rgu_mind_collection"

        self._ensure_collection_exists()

    def _ensure_collection_exists(self):
        try:
            self.qdrant.get_collection(collection_name=self.collection_name)
        except Exception:
            self.qdrant.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=1024,
                    distance=Distance.COSINE
                )
            )
        # Ensure payload indexes exist (required for filtering)
        for field in ["document_id", "department_id"]:
            try:
                self.qdrant.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema=PayloadSchemaType.KEYWORD
                )
            except Exception:
                pass  # Index already exists, that's fine

    async def embed_and_store(self, document_id: UUID, db: Session):
        chunks = db.query(Chunk).filter(Chunk.document_id == document_id).all()

        if not chunks:
            raise ValueError("No chunks found for this document")

        # Get department_id via Document → Regulation chain
        document = db.query(Document).filter(Document.id == document_id).first()
        regulation = db.query(Regulation).filter(Regulation.id == document.regulation_id).first()
        department_id = regulation.department_id

        texts = [c.content for c in chunks]

        response = self.co.embed(
            texts=texts,
            model="embed-multilingual-v3.0",
            input_type="search_document"
        )
        embeddings = response.embeddings

        self._ensure_collection_exists()

        points = [
            PointStruct(
                id=str(c.id),
                vector=embeddings[i],
                payload={
                    "document_id": str(document_id),
                    "department_id": str(department_id),
                    "chunk_id": str(c.id),
                    "content": c.content,
                    "page_ref": c.page_ref
                }
            )
            for i, c in enumerate(chunks)
        ]

        self.qdrant.upsert(
            collection_name=self.collection_name,
            points=points
        )
        return {"message": f"Embedded {len(points)} chunks successfully"}

    def delete_embedding_documents(self, document_ids: list[UUID]):
        if not document_ids:
            return
            
        self.qdrant.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchAny(any=[str(doc_id) for doc_id in document_ids])
                    )
                ]
            )
        )

    def search(self, query: str, top_k: int, department_id: UUID):
        response = self.co.embed(
            texts=[query],
            model="embed-multilingual-v3.0",
            input_type="search_query"
        )
        query_embedding = response.embeddings[0]

        response = self.qdrant.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            limit=top_k,
            score_threshold=0.5,
            query_filter=Filter(
                must=[
                    FieldCondition(
                        key="department_id",
                        match=MatchAny(any=[str(department_id)])
                    )
                ]
            )
        )
        return response.points
        
     

embedding_service = EmbeddingService()
