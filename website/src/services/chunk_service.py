from io import BytesIO
from sqlalchemy.orm import Session
from uuid import UUID
from langchain_text_splitters import RecursiveCharacterTextSplitter
import fitz
from schemes.chunk_schemes import ChunkResponse
from models.chunk_model import Chunk
import uuid
import re
from collections import Counter

class ChunkService:
    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ". ", "? ", "! ", " "]
        )
        # Generic Course Code Regex: e.g. CS 101, MATH201, حاسب 101, ريض201
        self.code_pattern = re.compile(r'(?:[A-Za-z]{2,4}|[أ-ي]{2,4})\s*[A-Za-z]?\s*[0-9xX]{2,4}')

    def fix_arabic_text(self, text: str) -> str:
        if not text:
            return ""
        text = text.strip()
        # If it has arabic characters, reverse it (common PDF extraction issue)
        if any("\u0600" <= c <= "\u06FF" for c in text):
            return text[::-1]
        return text

    def find_repeated_lines(self, pages_text: list, threshold: int = 3) -> set:
        all_lines = []
        for _, text in pages_text:
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            all_lines.extend(lines)
        
        counter = Counter(all_lines)
        return {line for line, count in counter.items() if count >= threshold}

    def clean_text(self, text: str, repeated_lines: set) -> str:
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        # Remove repeated header/footer lines and lines that are just a single code
        lines = [l for l in lines if l not in repeated_lines and not re.fullmatch(r'[A-Z]\d+', l)]
        return "\n".join(lines)

    def create_chunk(self, db: Session, file: bytes, document_id: UUID, filename: str):
        result_chunks = []
        chunk_index = 0
        pages_text = []

        pdf_fitz = fitz.open(stream=BytesIO(file), filetype="pdf")

        for page_num in range(len(pdf_fitz)):
            page = pdf_fitz[page_num]
            page_content = ""

            # 1. Dynamic Table Extraction
            tabs = page.find_tables()
            for tab in tabs:
                table_data = tab.extract()
                if not table_data:
                    continue

                full_table_text = " ".join([str(item) for row in table_data for item in row if item])
                
                # If it's a detail box (like course syllabus)
                is_detail_box = any(k in full_table_text for k in ["المحتوى", "محتوى", "اسم المقرر", "وصف المقرر"])
                
                if is_detail_box:
                    clean_cells = [self.fix_arabic_text(str(c)) for row in table_data for c in row if c]
                    box_text = " | ".join(clean_cells)
                    page_content += f"\nتفاصيل المقرر (من الصندوق): {box_text}\n"
                    continue

                # Regular Row-by-Row Extraction
                for row in table_data:
                    clean_row = [self.fix_arabic_text(str(c)) for c in row if c]
                    if not clean_row:
                        continue

                    # Generic Course Code Regex: e.g. CS 101, ENG X61, حاسب 101, Cxx4x1
                    code_pattern = re.compile(r'(?:[A-Za-z]{2,4}|[أ-ي]{2,4})\s*[A-Za-z]?\s*[0-9xX]{2,4}')
                    
                    codes_found = [c for c in clean_row if code_pattern.search(c)]
                    credits_found = [c for c in clean_row if c.strip().isdigit() and len(c.strip()) == 1]
                    
                    # Exclude cells that look like a credit prerequisite (e.g., '112 Cr. H')
                    def is_prereq(text):
                        t = text.lower()
                        return any(kw in t for kw in ['cr', 'credit', 'ساعة', 'ساعات', 'متطلب'])
                    
                    prereqs_without_code = [c for c in clean_row if len(c) > 5 and is_prereq(c) and not code_pattern.search(c)]
                    
                    names_found = [c for c in clean_row if len(c) > 5 and not code_pattern.search(c) and not c.strip().isdigit() and not is_prereq(c)]

                    if codes_found and names_found:
                        main_code = codes_found[0]
                        main_name = " ".join(names_found)
                        credits = credits_found[0] if credits_found else "غير محدد"
                        prereqs = [c for c in codes_found if c != main_code] + prereqs_without_code
                        prereq_str = ", ".join(prereqs) if prereqs else "لا يوجد متطلب سابق"
                        
                        # Add any leftover cells to prevent data loss
                        used_cells = set(codes_found + names_found + credits_found + prereqs_without_code)
                        extra_info = [c for c in clean_row if c not in used_cells]
                        extra_str = ("، معلومات إضافية: " + " | ".join(extra_info)) if extra_info else ""

                        desc_text = (
                            f"مادة: {main_name}، كود المقرر: {main_code}، "
                            f"الساعات المعتمدة: {credits}، المتطلب السابق: {prereq_str}{extra_str}."
                        )
                        page_content += "\n" + desc_text + "\n"
                    else:
                        # Just regular table content if it's not a course row
                        if any(clean_row):
                            page_content += " | ".join(clean_row) + "\n"

            # 2. Page Text
            text = page.get_text("text")
            if text.strip():
                page_content += "\n" + text

            if page_content.strip():
                pages_text.append((page_num + 1, page_content))

        pdf_fitz.close()

        # Handle repeated lines for generic text
        repeated = self.find_repeated_lines(pages_text)
        
        all_final_chunks = []

        # Add general text chunks
        for page_num, page_content in pages_text:
            clean = self.clean_text(page_content, repeated)
            if not clean.strip():
                continue

            # Append detected codes at the top of the page chunk if found (metadata enrichment)
            codes_on_page = self.code_pattern.findall(clean)
            if codes_on_page:
                clean = f"الأكواد الموجودة في هذه الصفحة: {', '.join(set(codes_on_page))}\n" + clean

            sub_chunks = self.splitter.split_text(clean)
            for chunk_text in sub_chunks:
                all_final_chunks.append((chunk_text, str(page_num)))

        # Insert to DB
        for chunk_text, page_ref in all_final_chunks:
            chunk_uuid = uuid.uuid4()
            db.add(Chunk(
                id=chunk_uuid,
                document_id=document_id,
                chunk_index=chunk_index,
                content=chunk_text,
                page_ref=page_ref
            ))
            result_chunks.append(ChunkResponse(
                source=filename,
                chunk_id=chunk_uuid,
                content=chunk_text,
                page=int(page_ref)
            ))
            chunk_index += 1

        db.commit()
        return result_chunks

chunk_service = ChunkService()
