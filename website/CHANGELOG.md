# 📋 سجل التعديلات - RGU Mind Backend

## 📅 جلسة: 2026-06-25

---

## 1. 🐳 Dockerfile — تفعيل الصورة وتسريع الـ Build

**الملف:** `src/Dockerfile`

### المشكلة
- السطر `FROM python:3.11-slim` كان موضوعاً كتعليق (`#`) مما يعني إن دوكر مكانش يعرف يبني الصورة خالص.

### التعديلات
- إزالة علامة `#` من أول السطر لتفعيل الصورة.
- استبدال `RUN pip install --no-cache-dir -r requirements.txt` بـ:
  ```dockerfile
  RUN --mount=type=cache,target=/root/.cache/pip \
      pip install -r requirements.txt
  ```
- **السبب:** استخدام **BuildKit Cache Mount** بيخلي دوكر يحتفظ بنسخة من المكتبات المحملة. بكدا لو زودت مكتبة جديدة للـ `requirements.txt`، دوكر هينزل بس المكتبة الجديدة ومش هيعيد تنزيل كل حاجة من الصفر.

---

## 2. 🔗 API Flow — دمج الـ Upload والـ Chunking في ريكويست واحد

**الملف:** `src/routes/data.py`

### المشكلة
- كانت عملية رفع الملف (`upload`) والـ Chunking موجودة كـ Endpoints منفصلة.
- كان لازم تبعت ريكويستين على التوالي.

### التعديلات
- دمج الـ Endpoints في `POST /data/upload` واحد.
- استخدام `BackgroundTasks` من FastAPI، بحيث:
  1. يرد على اليوزر فوراً بعد رفع الملف.
  2. عملية الـ Chunking والـ Embedding تتم في **الخلفية** بدون ما تبطئ الريكويست.
- إنشاء `SessionLocal` مستقلة للـ Background Task عشان الـ Session الأصلية بتتقفل بعد الرد.

---

## 3. 🐛 Bug Fix — تصحيح خطأ في حفظ الـ Embeddings

**الملف:** `src/services/embedding_service.py`

### المشكلة
- الكود كان بيحط **كل الـ Embeddings** جوه كل `PointStruct` بدل ما يحط embedding الـ Chunk الخاص بيه بس.
- يعني لو الملف فيه 100 Chunk، كان بيبعت للـ Qdrant **100 × 100 = 10,000 Vector** بدل 100 بس، مما كان يسبب Timeout.

### التعديل
```python
# ❌ قبل
vector=embeddings

# ✅ بعد
vector=embeddings[i]
for i, c in enumerate(chunks)
```

---

## 4. ⏱️ Qdrant Timeout

**الملف:** `src/services/embedding_service.py`

- زيادة الـ Timeout بتاع الـ Qdrant Client إلى `60.0` ثانية لتفادي مشاكل Timeout مع الملفات الكبيرة.

---

## 5. ✨ Feature — Reset Department Qdrant Embeddings

**الملفات:** `routes/data.py`, `controllers/data_controller.py`, `services/data_service.py`, `services/embedding_service.py`

### الوصف
إضافة Endpoint يتيح للجامعة حذف الـ Embeddings الخاصة بـ Department معين من Qdrant مع إبقاء كل البيانات الأخرى (الملفات الأصلية، قاعدة البيانات) سليمة.

### الـ Endpoint الجديد
```
DELETE /data/reset/{department_id}
```

### الـ Flow
1. **Service** (`data_service.py`): تجيب كل الـ Regulations الخاصة بالـ Department، ثم كل الـ Documents الخاصة بيهم، وتجمع الـ `document_ids`.
2. **EmbeddingService** (`embedding_service.py`): تمسح الـ Vectors الخاصة بالـ `document_ids` دي من Qdrant في ريكويست واحد.

---

## 6. 🗂️ Qdrant Payload Index

**الملف:** `src/services/embedding_service.py`

### المشكلة
عند محاولة الحذف بالفلتر، كان Qdrant يرفع هذا الخطأ:
> `Index required but not found for "document_id"`

### التعديل
إضافة `create_payload_index` على حقل `document_id` من نوع `KEYWORD` داخل `_ensure_collection_exists`. هذا الـ Index ضروري حتى يتمكن Qdrant من الفلترة على الـ Payload بكفاءة.

---

## 7. 🗄️ Database Migration — إضافة أعمدة جديدة لجدول University

**الملف:** `alembic/versions/ccbdbf50f1b2_...py`

### المشكلة
نموذج `University` في SQLAlchemy كان يحتوي على أعمدة جديدة (`verification_file_url`, `status`, `is_email_verified`) غير موجودة في الداتا بيز الفعلية.

### التعديل
- إنشاء Migration جديد بـ `alembic revision --autogenerate`.
- تعديل الـ Migration يدوياً لإضافة `server_default='default.pdf'` على العمود `verification_file_url` حتى لا يحدث خطأ `NotNullViolation` عند وجود صفوف قديمة في الجدول.
- تطبيق التغيير بـ `alembic upgrade head`.

---

## 🏗️ Architecture المتبعة

```
Route (routes/) 
    → Controller (controllers/)
        → Service (services/)
            → Database (SQLAlchemy) / Qdrant / File System
```
