from cohere import Client
from helpers.config import COHERE_API_KEY
from helpers.config import GROQ_API_KEY
import groq

class LLMService:
    def __init__(self):
        self.groq = groq.Groq(api_key=GROQ_API_KEY)

    def generate_answer(self, query: str, context_chunks: list[str]):
        context = "\n\n".join(context_chunks)
        system_prompt = """You are a highly strict academic assistant for RGU university. 
Your ONLY task is to answer student questions based strictly on the provided documents.

CRITICAL RULES:
1. You are FORBIDDEN from answering using outside knowledge. You must ONLY use the provided documents.
2. If the answer is NOT explicitly stated in the documents, you MUST output EXACTLY this phrase and nothing else: "عذراً، هذه المعلومة غير متوفرة في اللائحة المتاحة". Do NOT guess, deduce, or hallucinate answers.
3. If the answer is found, cite the article number (مادة) if available, AND you MUST explicitly mention the Chunk ID ([رقم الشانك: ...]) that you used to get the answer.
4. OCR Error Warning: The provided text is extracted from a PDF and contains Arabic numeral extraction errors. Specifically, the number '0' is often extracted as '1'. For example, '100' might appear as '111'. If you see '111' next to the word '(مائة)' (which means one hundred), you must correct it to '100' in your final answer. Apply logic to fix obvious numerical typos.
5. Your final response MUST be entirely in Arabic, concise, and accurate."""

        user_prompt = f"المستندات:\n{context}\n\nالسؤال: {query}\nالإجابة:"

        response = self.groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0
        )
        return response.choices[0].message.content

llm_service = LLMService()
