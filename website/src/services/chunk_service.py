"""
ChunkService — Layout-aware PDF chunker.

Final indexed objects:
  1. study_plan   — one chunk per study-plan table (per page section)
  2. course_desc  — one chunk per complete course description box

Everything else (table_row, page_context duplicates) is deliberately excluded.
"""

from io import BytesIO
from collections import Counter
from sqlalchemy.orm import Session
from uuid import UUID
from langchain_text_splitters import RecursiveCharacterTextSplitter
import fitz
from schemes.chunk_schemes import ChunkResponse
from models.chunk_model import Chunk
import uuid
import re


# ─── Constants ────────────────────────────────────────────────────────────────

COURSE_DESC_SIGNALS = {
    "وصف المقرر", "محتوى المقرر", "Course Syllabus", "Syllabus",
    "ىوتحملا", "المحتوى", "اسم المقرر", "ررقملا مسا",
    "الهدف من المقرر", "Course Description", "Course Objectives",
    "Course Content", "Learning Outcomes", "مخرجات التعلم",
}

STUDY_PLAN_SIGNALS = {
    "الفصل الدراسي", "فصل الخريف", "فصل الربيع", "Semester",
    "إجمالي الساعات", "Total Credits", "الخطة الدراسية", "Study Plan",
    "مقررات إجبارية", "مقررات اختيارية", "متطلبات الجامعة",
    "الساعات المعتمدة",
}

YEAR_PATTERN = re.compile(
    r'(السنة\s*(الأولى|الأول|الثانية|الثاني|الثالثة|الثالث|الرابعة|الرابع)'
    r'|Year\s*[1-4]|Level\s*[1-4]'
    r'|الفصل\s*(الأول|الثاني)'
    r'|فصل\s*(الخريف|الربيع)'
    r'|مستوى\s*(الأول|الثاني|الثالث|الرابع|[1-4])'
    r'|الفرقة\s*(الأولى|الثانية|الثالثة|الرابعة))',
    re.UNICODE,
)

CODE_PATTERN = re.compile(r'[A-Z]{2,4}\s*\d{3,4}')

IGNORED_LINE_PATTERNS = [
    re.compile(r'Page\s*\d+', re.IGNORECASE),
    re.compile(r'^\d+$'),
]


# ─── Service ──────────────────────────────────────────────────────────────────

class ChunkService:

    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=900,
            chunk_overlap=100,
            separators=["\n\n", "\n", ". ", "؟ ", "! ", " "],
        )

    # ── Utilities ─────────────────────────────────────────────────────────────

    @staticmethod
    def fix_arabic(text: str) -> str:
        if not text:
            return ""
        text = text.strip()
        if any("\u0600" <= c <= "\u06FF" for c in text):
            return text[::-1]
        return text

    @staticmethod
    def _is_noise(line: str) -> bool:
        line = line.strip()
        if not line:
            return True
        for pat in IGNORED_LINE_PATTERNS:
            if pat.search(line):
                return True
        return False

    @staticmethod
    def _find_repeated_lines(page_texts: list, threshold: int = 3) -> set:
        counter = Counter()
        for text in page_texts:
            for line in text.splitlines():
                line = line.strip()
                if line:
                    counter[line] += 1
        return {ln for ln, cnt in counter.items() if cnt >= threshold}

    # ── Page-type detection ───────────────────────────────────────────────────

    def _detect_page_type(self, page_text: str, tables_raw: list) -> str:
        for table_data in tables_raw:
            flat = " ".join(str(cell) for row in table_data for cell in row if cell)
            if any(sig in flat for sig in COURSE_DESC_SIGNALS):
                return "course_description"

        desc_score = sum(1 for sig in COURSE_DESC_SIGNALS if sig in page_text)
        plan_score = sum(1 for sig in STUDY_PLAN_SIGNALS if sig in page_text)

        if desc_score >= 2:
            return "course_description"
        if plan_score >= 1:
            return "study_plan"
        return "generic"

    # ── Study-plan extraction ─────────────────────────────────────────────────

    def _extract_study_plan(self, page, raw_text: str, repeated: set) -> list:
        header_lines = []
        for line in raw_text.splitlines():
            clean = line.strip()
            if clean and clean not in repeated and not self._is_noise(clean):
                header_lines.append(self.fix_arabic(clean))
            if len(header_lines) >= 6:
                break

        year_match = YEAR_PATTERN.search(raw_text)
        year_label = year_match.group(0).strip() if year_match else ""

        parts = []
        if year_label:
            parts.append(f"[{year_label}]")
        if header_lines:
            parts.append("السياق: " + " | ".join(header_lines))

        table_blocks = []
        for tab in page.find_tables():
            data = tab.extract()
            if not data:
                continue
            flat = " ".join(str(c) for row in data for c in row if c)
            if any(sig in flat for sig in COURSE_DESC_SIGNALS):
                continue
            rows = []
            for row in data:
                clean_row = [self.fix_arabic(str(c)) for c in row if c]
                if not clean_row:
                    continue

                codes_found = [c for c in clean_row if CODE_PATTERN.search(c)]
                credits_found = [c for c in clean_row if c.strip().isdigit() and len(c.strip()) == 1]
                names_found = [c for c in clean_row if len(c) > 4 and not CODE_PATTERN.search(c) and not c.strip().isdigit()]

                if codes_found and names_found:
                    main_code = codes_found[0]
                    main_name = " ".join(names_found)
                    credits = credits_found[0] if credits_found else "غير محدد"
                    prereqs = [c for c in codes_found if c != main_code]
                    prereq_str = ", ".join(prereqs) if prereqs else "لا يوجد متطلب سابق"
                    
                    desc_text = f"- مادة: {main_name} | كود: {main_code} | الساعات المعتمدة: {credits} | متطلب سابق: {prereq_str}"
                    rows.append(desc_text)
                else:
                    rows.append(" | ".join(clean_row))
            if rows:
                table_blocks.append("\n".join(rows))

        if not table_blocks:
            return []

        parts.extend(table_blocks)
        full = "\n\n".join(parts).strip()

        if len(full) > 900:
            return self.splitter.split_text(full)
        return [full]

    # ── Course-description extraction ─────────────────────────────────────────

    def _extract_course_descriptions(self, page) -> list:
        courses = []
        for tab in page.find_tables():
            data = tab.extract()
            if not data:
                continue
            flat = " ".join(str(c) for row in data for c in row if c)
            if not any(sig in flat for sig in COURSE_DESC_SIGNALS):
                continue

            cells = [self.fix_arabic(str(c)) for row in data for c in row if c]
            course_text = " | ".join(cells).strip()
            if not course_text:
                continue

            codes = list(set(CODE_PATTERN.findall(course_text)))
            if codes:
                course_text = f"الأكواد: {', '.join(codes)}\n{course_text}"

            if len(course_text) > 900:
                courses.extend(self.splitter.split_text(course_text))
            else:
                courses.append(course_text)

        return courses

    # ── Generic fallback ──────────────────────────────────────────────────────

    def _extract_generic(self, raw_text: str, repeated: set) -> list:
        lines = [
            self.fix_arabic(l)
            for l in raw_text.splitlines()
            if not self._is_noise(l) and l.strip() not in repeated
        ]
        clean = "\n".join(lines).strip()
        if len(clean) < 30:
            return []
        if len(clean) > 900:
            return self.splitter.split_text(clean)
        return [clean]

    # ── Main entry point ──────────────────────────────────────────────────────

    def create_chunk(self, db: Session, file: bytes, document_id: UUID, filename: str):
        result_chunks = []
        chunk_index = 0

        doc = fitz.open(stream=BytesIO(file), filetype="pdf")

        # Pass 1: collect raw text for noise detection
        raw_page_texts = [page.get_text("text") for page in doc]
        repeated = self._find_repeated_lines(raw_page_texts)

        # Pass 2: extract per page
        for page_num, page in enumerate(doc):
            raw_text = raw_page_texts[page_num]
            tables_raw = [t.extract() for t in page.find_tables() if t.extract()]
            page_type = self._detect_page_type(raw_text, tables_raw)

            if page_type == "study_plan":
                texts = self._extract_study_plan(page, raw_text, repeated)
                chunk_type = "study_plan"
            elif page_type == "course_description":
                texts = self._extract_course_descriptions(page)
                chunk_type = "course_desc"
            else:
                texts = self._extract_generic(raw_text, repeated)
                chunk_type = "generic"

            for text in texts:
                if not text.strip():
                    continue
                chunk_uuid = uuid.uuid4()
                db.add(Chunk(
                    id=chunk_uuid,
                    document_id=document_id,
                    chunk_index=chunk_index,
                    content=text,
                    page_ref=str(page_num + 1),
                ))
                result_chunks.append(ChunkResponse(
                    source=filename,
                    chunk_id=chunk_uuid,
                    content=text,
                    page=page_num + 1,
                ))
                chunk_index += 1

        doc.close()
        db.commit()
        return result_chunks


chunk_service = ChunkService()
