from io import BytesIO
from sqlalchemy.orm import Session
from uuid import UUID
from langchain_text_splitters import RecursiveCharacterTextSplitter
import fitz
import pdfplumber
from schemes.chunk_schemes import ChunkResponse
from models.chunk_model import Chunk
import uuid
import re
from arabic_reshaper import reshape
from bidi.algorithm import get_display
from collections import Counter

class ChunkService:
    def __init__(self):

        self.splitter=RecursiveCharacterTextSplitter(
            chunk_size = 500,
            chunk_overlap = 50,
            separators=[
        "\n\n",
        "\n",
        ". ",
        "? ",
        "! ",
        " "
        ])
        
    # إزالة الأسطر المتكررة (header/footer)
    def find_repeated_lines(self, pages_text: list, threshold: int = 3) -> set:
        all_lines = []
        for _, text in pages_text:
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            all_lines.extend(lines)
        
        counter = Counter(all_lines)
        return {line for line, count in counter.items() if count >= threshold}

    def clean_text(self, text: str, repeated_lines: set) -> str:
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        lines = [l for l in lines if l not in repeated_lines and not re.fullmatch(r'[A-Z]\d+',l)]
        return "\n".join(lines)



    def create_chunk(self, db: Session, file: bytes, document_id: UUID, filename: str):
        result_chunks = []
        chunk_index = 0
        pages_text = []

        # pdfplumber للجداول
        with pdfplumber.open(BytesIO(file)) as pdf_plumber:
            plumber_pages = pdf_plumber.pages

            # fitz للنص
            pdf_fitz = fitz.open(stream=BytesIO(file), filetype="pdf")

            for page_num in range(len(pdf_fitz)):
                page_content = ""

                # 1.الجداول بـ pdfplumber
                tables = plumber_pages[page_num].extract_tables()
                for table in tables:
                    for row in table:
                        clean_row = []
                        for cell in row:
                            if cell:
                                cell = cell.strip()
                                # عكس النص لو كان بيحتوي على حروف عربية لأن pdfplumber بيجيبه معكوس
                                if re.search(r'[\u0600-\u06FF]', cell):
                                    cell = cell[::-1]
                                clean_row.append(cell)
                            else:
                                clean_row.append("")
                        if any(clean_row):
                            page_content += " | ".join(clean_row) + "\n"

                # 2. النص بـ fitz
                text = pdf_fitz[page_num].get_text("text")
                if text.strip():
                    page_content += "\n" + text

                if page_content.strip():
                    pages_text.append((page_num + 1, page_content))

            pdf_fitz.close()

        repeated = self.find_repeated_lines(pages_text)

        for page_num, page_content in pages_text:
            clean = self.clean_text(page_content, repeated)
            if not clean.strip():
                continue

            sub_chunks = self.splitter.split_text(clean)
            for chunk_text in sub_chunks:
                chunk_uuid = uuid.uuid4()
                db.add(Chunk(
                    id=chunk_uuid,
                    document_id=document_id,
                    chunk_index=chunk_index,
                    content=chunk_text,
                    page_ref=str(page_num)
                ))
                result_chunks.append(ChunkResponse(
                    source=filename,
                    chunk_id=chunk_uuid,
                    content=chunk_text,
                    page=page_num
                ))
                chunk_index += 1

        db.commit()
        return result_chunks

chunk_service = ChunkService()
