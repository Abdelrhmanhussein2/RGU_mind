from cohere import Client
from helpers.config import COHERE_API_KEY, GROQ_API_KEY, GEMINI_API_KEY
import groq
import re
from uuid import UUID
from google import genai
from google.genai import types

class LLMService:
    def __init__(self):
        self.groq = groq.Groq(api_key=GROQ_API_KEY)
        # Generic Code Pattern
        self.code_pattern = re.compile(r'(?:[A-Za-z]{2,4}|[أ-ي]{2,4})\s*\d{2,4}')

    def _call_llm(self, system_prompt: str, user_prompt: str, temperature: float = 0.0, history: list = None) -> str:
        try:

            client = genai.Client(api_key=GEMINI_API_KEY)
            
            config_kwargs = {"temperature": temperature}
            if system_prompt:
                config_kwargs["system_instruction"] = system_prompt
                
            contents = []
            if history:
                for msg in history:
                    role = "model" if msg["role"] == "assistant" else msg["role"]
                    content_text = msg["content"]
                    try:
                        part = types.Part(text=content_text)
                    except Exception:
                        part = types.Part.from_text(text=content_text)
                    contents.append(types.Content(role=role, parts=[part]))
            try:
                user_part = types.Part(text=user_prompt)
            except Exception:
                user_part = types.Part.from_text(text=user_prompt)
            contents.append(types.Content(role="user", parts=[user_part]))

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(**config_kwargs)
            )
            
            text = response.text
            if text:
                return text.strip()
            raise ValueError("Empty response from Gemini")
        except Exception as e:
            import sys
            print(f"Gemini API call failed, falling back to Groq: {str(e)}", file=sys.stderr)
            
            # Groq Fallback
            messages = [{"role": "system", "content": system_prompt}]
            if history:
                messages.extend(history)
            messages.append({"role": "user", "content": user_prompt})

            response = self.groq.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=temperature
            )
            return response.choices[0].message.content.strip()

    def formulate_search_query(self, query: str, history: list = None) -> str:
        history_context = ""
        if history:
            history_context = "سياق المحادثة السابقة:\n" + "\n".join([f"{msg['role']}: {msg['content']}" for msg in history[-3:]]) + "\n\n"
            
        system_prompt = f"""أنت خبير في صياغة جمل البحث (Search Queries).
مهمتك استخراج الكلمات المفتاحية الأكاديمية (مثل: المستوى الصفري، متطلبات الجامعة، فصل الخريف، اسم المادة، الكود) من سؤال الطالب الحالي، مع مراعاة سياق المحادثة السابقة إذا كان السؤال يعتمد عليه (مثلاً إذا قال "الخريف" وكان السياق عن "المستوى الصفري"، يجب أن تكون جملة البحث "المستوى الصفري فصل الخريف").

{history_context}
إذا كان السؤال يحتوي على مصطلحات عامية (مثل "انا دلوقتي مستوي صفري اي المواد اللي المفروض اسجلها") حولها إلى مصطلحات بحث أكاديمية دقيقة.
حافظ على الأرقام والأكواد كما هي. النتيجة يجب أن تكون جملة البحث فقط بدون أي إضافات."""
        return self._call_llm(system_prompt=system_prompt, user_prompt=query, temperature=0.0)

    def clean_chunk(self, text: str) -> str:
        text = re.sub(r'<br>', ' ', text)
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
        # Fix RTL flipped numbers before 'ساعة' or 'ساعات'
        def flip_number(match):
            num = match.group(1)
            # Only flip if it looks like a number that was reversed (e.g., 211 -> 112)
            # But actually, let's just flip all 2 or 3 digit numbers before ساعة to be safe
            # For 211 it becomes 112. 
            return num[::-1] + match.group(2)
        text = re.sub(r'(\d{2,3})(\s*ساعة|\s*ساعات)', flip_number, text)
        # Fix the specific messed up sentence structure for graduation project prerequisites
        text = text.replace("الطالب 211ساعة", "الطالب 112 ساعة") 
        text = text.replace("211ساعة", "112 ساعة")
        return text.strip()

    def _extract_prereq_codes_from_response(self, response_text: str) -> list[str]:
        prereq_line_match = re.search(
            r'\|\s*[*]*المتطلبات السابقة[*]*\s*\|\s*([^|\n]+)',
            response_text
        )
        if prereq_line_match:
            prereq_cell = prereq_line_match.group(1)
            codes = self.code_pattern.findall(prereq_cell)
            return list(set(codes))
        return []

    def _enrich_prerequisites(self, response_text: str, main_code: str, department_id: UUID) -> str:
        from services.embedding_service import embedding_service
        prereq_codes = self._extract_prereq_codes_from_response(response_text)
        
        if main_code:
            prereq_codes = [c for c in prereq_codes if c != main_code]

        if not prereq_codes or not department_id:
            return response_text

        found_prereqs = []
        for code in prereq_codes:
            search_queries = [
                f"مادة كود {code}",
                f"كود المقرر {code}",
                f"{code} اسم المادة",
            ]
            name_found = False
            for query in search_queries:
                if name_found:
                    break
                results = embedding_service.search(query, top_k=3, department_id=department_id)
                for hit in results:
                    chunk = hit.payload.get("content", "")
                    if code in chunk:
                        name_match = re.search(r'مادة:\s*([^،|\n]+)', chunk)
                        if name_match:
                            name = name_match.group(1).strip()
                            if name and "Prerequisite" not in name and len(name) > 2:
                                found_prereqs.append(f"- **{code}**: {name}")
                                name_found = True
                                break

        if found_prereqs:
            list_text = (
                "\n\n📚 **تفاصيل المتطلبات السابقة:**\n"
                + "\n".join(found_prereqs)
            )
            return response_text + list_text

        return response_text

    def _is_specific_course_question(self, question: str) -> bool:
        if self.code_pattern.search(question):
            return True
        general_keywords = [
            "أفضل", "افضل", "أنسب", "انسب", "ماذا أسجل", "ماذا اسجل",
            "أختار", "اختار", "أقترح", "اقترح", "أي مواد", "اي مواد", "أي مقررات", "اي مقررات",
            "best", "recommend", "suggest", "which courses", "مقررات", "مواد", "courses", "subjects",
            "كل", "جميع", "قائمة", "لستة"
        ]
        q_lower = question.lower()
        for kw in general_keywords:
            if kw in q_lower:
                return False
        specific_keywords = ["مادة", "مقرر", "course", "subject", "كود"]
        for kw in specific_keywords:
            if kw in q_lower:
                return True
        return False

    def generate_answer(self, query: str, context_chunks: list[str], department_id: UUID = None, history: list = None):
        if not context_chunks:
            return "عذراً، هذه المعلومة غير متوفرة في اللائحة المتاحة."

        context = "\n\n".join([self.clean_chunk(c) for c in context_chunks])
        main_codes = self.code_pattern.findall(query)
        main_code = main_codes[0] if main_codes else ""
        is_specific = self._is_specific_course_question(query)

        if is_specific:
            system_prompt = f"""أنت مستشار أكاديمي خبير في اللوائح الجامعية.
مهمتك: تقديم تقرير دقيق ومنظم عن المادة المطلوبة بناءً على السياق المرفق فقط.

⚠️ **قواعد صارمة لمنع الهلوسة:**
1. ابدأ دائماً ردك بالسلام والترحيب (مثلاً: "أهلاً بك عزيزي الطالب، ...").
2. **الاستفسار والخيارات:** إذا كان السؤال غير واضح أو يحتمل أكثر من إجابة، اطرح سؤالاً توضيحياً وضع الخيارات في النهاية بين أقواس مربعة (مثال: [خيار 1] [خيار 2]) لتتحول إلى أزرار.
3. **دقة المتطلبات:** لا تذكر أي كود كمتطلب سابق إلا إذا ذُكر صراحةً في النص على أنه متطلب لهذه المادة تحديداً.
4. **الساعات المعتمدة:** اذكر الرقم الموجود في النص فقط، لا تخترع أرقاماً.
5. **اذكر الأكواد كما هي** في خانة المتطلبات، سيتم إضافة الأسماء تلقائياً.
6. لا تستخدم معلومات من خارج السياق المرفق.
7. إذا لم تجد المادة في السياق، أجب بـ "عذراً، هذه المعلومة غير متوفرة في اللائحة المتاحة".

التنسيق المطلوب للرد (اجعله طبيعياً وبسيطاً):
[أضف الترحيب هنا في السطر الأول]

إليك تفاصيل مادة **[اسم المادة]**:
🔹 **الكود:** [Course Code]
🔹 **المستوى الدراسي:** [استخرجه من النص، أو: غير محدد]
🔹 **الساعات المعتمدة:** [عدد من النص] ساعات
🔹 **المتطلبات السابقة:** [الأكواد المذكورة صراحةً كمتطلب، أو: لا يوجد متطلب سابق]

[إذا توفر محتوى دراسي، أضفه هنا كقائمة نقطية تحت عنوان: 📚 **المحتوى الدراسي**]

[إذا توفرت ملاحظات هامة، أضفها هنا تحت عنوان: 💡 **ملاحظات هامة**]

CONTEXT:
{context}
"""
        else:
            system_prompt = f"""أنت مستشار أكاديمي خبير في اللوائح الجامعية. 
مهمتك هي مساعدة الطالب بناءً على السياق المرفق فقط.

⚠️ **قواعد هامة جداً (يجب الالتزام بها حرفياً):**
1. ابدأ دائماً ردك بالسلام والترحيب بطريقة ودودة (مثلاً: "أهلاً بك عزيزي الطالب، ...").
2. **الاستفسار عند الغموض الشديد فقط:** إذا كان سؤال الطالب ناقصاً جداً ويستحيل الإجابة عليه (مثلاً: يسأل عن "المستوى الصفري" ولم يحدد خريف أم ربيع)، توقف واطرح سؤالاً توضيحياً وضع الخيارات بين أقواس مربعة (مثال: [فصل الخريف] [فصل الربيع]).
3. **لا تسأل إذا كان السؤال شاملاً:** إذا سأل الطالب عن "كل المقررات" أو "لكل سنة"، أجب إجابة كاملة شاملة، **ويُمنع منعاً باتاً أن تسأله أي سؤال توضيحي في النهاية أو تضع خيارات.**
4. أجب بشكل مباشر ومختصر فقط إذا كان السؤال واضحاً ومحدداً.
5. 🚫 تحذير هام لمنع الهلوسة (CRITICAL): في المستندات، جداول الخريف والربيع تأتي متتالية وقد تتداخل النصوص. يجب أن تفرق بينها بعناية بالغة. توقف فوراً عن سرد المواد بمجرد الشك في أنك دخلت في مواد الفصل الآخر، أو بمجرد ظهور مواد تحمل رقم (2) إذا كنت تسرد مواد الخريف. لا تدمج أبداً مواد الفصلين معاً.
6. 🚫 **ممنوع كتابة أي كود مقرر نهائياً** (مثل HUM XE1 أو CCE 111). استخرج اسم المادة فقط وتجاهل الكود تماماً.
7. 🌟 **تنسيق الإجابة:** اجعل الإجابة جذابة بصرياً. استخدم الرموز التعبيرية (Emojis) المناسبة، ورتب المواد في قائمة نقطية جذابة (مثال: 🔹 اسم المادة).
8. قم بتصحيح أي أخطاء إملائية ناتجة عن استخراج النصوص.

CONTEXT:
{context}
"""

        raw_response = self._call_llm(system_prompt=system_prompt, user_prompt=query, temperature=0.0, history=history)

        if is_specific and department_id and "عذراً، هذه المعلومة غير متوفرة" not in raw_response:
            return self._enrich_prerequisites(raw_response, main_code, department_id)
            
        if not is_specific:
            # Force remove any course codes (like HUM XE1 or CCE 111) and following colon/dash
            # Match code pattern followed by optional colon, dash, or spaces
            scrub_pattern = re.compile(r'\b(?:[A-Za-z]{2,4}|[أ-ي]{2,4})\s*[A-Za-z0-9]{1,4}\b[\s:\-]*')
            raw_response = scrub_pattern.sub('', raw_response)
            
        return raw_response



llm_service = LLMService()
