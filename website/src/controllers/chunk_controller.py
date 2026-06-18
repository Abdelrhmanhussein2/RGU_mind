import re
import traceback
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID
from helpers.enums import ResponseStatus
from services.chunk_service import chunkservice
from models.document_model import Document
import os


class ChunkController:
    def extract_chunk(self, document_id: UUID, db: Session):
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={"status": "error", "message": "Document not found"}
                )
            
            if not os.path.exists(document.storage_path):
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={"status": "error", "message": "File not found on disk"}
                )
                
            with open(document.storage_path, "rb") as f:
                file_bytes = f.read()

            # Initialize chunkservice with the db session
            service = chunkservice(db=db)
            
            # Extract chunks from the provided file_bytes
            data_chunk = service.create_chunk(file_bytes, document_id, document.filename)
            
            return JSONResponse(
                status_code=status.HTTP_201_CREATED,
                content={
                    "status": ResponseStatus.SUCCESS.value if hasattr(ResponseStatus, 'SUCCESS') else "success",
                    "message": "Chunks extracted successfully",
                    "data": jsonable_encoder(data_chunk) if data_chunk else []
                }
            )
        except Exception as e:
            traceback.print_exc()
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "status": ResponseStatus.ERROR.value if hasattr(ResponseStatus, 'ERROR') else "error",
                    "message": f"Failed to extract chunks: {str(e)}"
                }
            )
