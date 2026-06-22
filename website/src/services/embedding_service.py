from huggingface_hub.inference._generated.types import text_classification
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
import re
from cohere import Client
from helpers.config import COHERE_API_KEY, QDRANT_API_KEY, QDRANT_URL
import qdrant_client 
from qdrant_client.models import VectorParams, PointStruct, Distance
from chunk_model import Chunk

class EmbeddingService:
    def __init__(self):
        self.co = Client(api_key=COHERE_API_KEY)
        self.qdrant = qdrant_client.QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY
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

    async def embed_and_store(self,document_id:UUID, db:Session):
        chunks=db.query(Chunk).filter(Chunk.document_id==document_id).all()

        if not chunks:
            raise ValueError("No chunks found for this document")

        texts=[
            c.content
            for c in chunks
        ]
        
        response = self.co.embed(
            texts=texts,
            model="embed-multilingual-v3.0",
            input_type="search_document"
        )
        embeddings = response.embeddings

        self._ensure_collection_exists()

        points=[
            PointStruct(
                id=str(c.id),
                vector=embeddings,
                payload={
                "document_id":str(document_id),
                "chunk_id":str(c.id),
                "content":c.content,
                "page_ref":c.page_ref
                }
            )
            for c in chunks
        ]


        self.qdrant.upsert(
            collection_name=self.collection_name,
            points=points
        )
        return {"message": f"Embedded {len(points)} chunks successfully"}
embedding_service=EmbeddingService()