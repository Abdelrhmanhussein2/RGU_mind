from cohere import Client
from helpers.config import COHERE_API_KEY
from helpers.config import GROQ_API_KEY
import groq

class LLMService:
    def __init__(self):
        self.groq = groq.Groq(api_key=GROQ_API_KEY)

    def generate_answer(self, query: str, context_chunks: list[str]):
        context = "\n\n".join(context_chunks)
        prompt = f"""You are a helpful assistant for university students. 
Please answer the following question in Arabic based on the provided documents.
If the answer is not contained within the documents, say "عذراً، لا أملك معلومات كافية للإجابة على هذا السؤال بناءً على المستندات المتاحة."

Documents:
{context}

Question: {query}
Answer:"""

        response = self.groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                "role": "user",
                "content": prompt,
                }
            ]
        )
        return response.choices[0].message.content

llm_service = LLMService()
