# RGU Mind Project Summary

هذا الملف ملخص تفصيلي لحالة المشروع حتى الآن، بحيث أي شخص جديد يدخل على الكود يفهم الفكرة العامة، تركيب الملفات، الفلوهات الموجودة، وطريقة التشغيل والاختبار.

## فكرة المشروع

المشروع هو Backend API مبني بـ FastAPI لإدارة جزء من نظام جامعي/تعليمي باسم RGU Mind.

الوظائف الموجودة حاليًا:

- تسجيل طالب.
- تسجيل دخول طالب.
- تسجيل جامعة.
- تسجيل دخول جامعة.
- رفع ملف regulation مربوط بقسم department.
- إنشاء بيانات اختبار أساسية: جامعة، كلية، قسم.

قاعدة البيانات المستخدمة PostgreSQL، والكود يتعامل معها عن طريق SQLAlchemy ORM.

## التشغيل

من داخل فولدر `src`:

```powershell
cd E:\RGU_mind\website\src
uvicorn main:app --port 5000 --reload
```

لو PostgreSQL مش شغال، شغله من جذر المشروع:

```powershell
docker compose -f docker/docker-compose.yaml up -d postgres
```

السيرفر يشتغل على:

```text
http://127.0.0.1:5000
```

## إعدادات قاعدة البيانات

الإعدادات الأساسية موجودة في:

```text
src/helpers/config.py
```

الكود يقرأ المتغيرات من `.env`، ولو مش موجودة يستخدم defaults:

```text
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_HOST=localhost
POSTGRES_DB=regumind
```

داخل Docker، ملف `docker/.env` يستخدم:

```text
POSTGRES_HOST=postgres
```

لكن عند تشغيل FastAPI محليًا على جهازك غالبًا `POSTGRES_HOST` يكون `localhost`.

## تركيب المشروع

الهيكل الأساسي:

```text
src/
  main.py
  routes/
  controllers/
  services/
  models/
  schemes/
  helpers/
  api_tests.http
  insert_test_data.py
```

الفكرة المعمارية الحالية:

- `routes`: تعريف endpoints واستقبال request.
- `controllers`: طبقة وسيطة بين الراوت والسيرفيس، مسؤولة عن تحويل errors إلى HTTP responses.
- `services`: منطق business logic والتعامل مع قاعدة البيانات.
- `models`: SQLAlchemy tables.
- `schemes`: Pydantic request/response schemas.
- `helpers`: إعدادات عامة، security، enums.

## نقطة بداية التطبيق

الملف:

```text
src/main.py
```

بيعمل الآتي:

- ينشئ FastAPI app.
- يستورد كل الموديلات عن طريق `import models` عشان SQLAlchemy يعرف الجداول.
- يشغل `Base.metadata.create_all(bind=engine)` عند startup.
- يربط `base_router`.

مهم: `create_all()` ينشئ الجداول الجديدة فقط، لكنه لا يعدل أعمدة موجودة. تعديلات الداتابيز موجودة الآن داخل Alembic في `alembic/versions/`.

## الراوتس الموجودة

كل الراوتس متجمعة في:

```text
src/routes/base.py
```

وفيه:

```text
/auth
/data
```

### Auth Routes

الملف:

```text
src/routes/auth.py
```

الراوتس:

```text
POST /auth/register
POST /auth/login
POST /auth/university/register
POST /auth/university/login
```

### Data Routes

الملف:

```text
src/routes/data.py
```

الراوت:

```text
POST /data/upload
```

يستقبل:

- `department_id` كـ query param.
- `title` كـ query param.
- `version` كـ query param.
- `file` في body كـ multipart/form-data.

## تسجيل الطالب

Endpoint:

```text
POST /auth/register
```

Request body:

```json
{
  "username": "test_student",
  "email": "student@example.com",
  "password": "password123",
  "university_name": "My University",
  "faculty": "Engineering"
}
```

`university_name` و `faculty` اختياريين حاليًا.

الفلو:

1. الراوت يستقبل `studentSignupRequest`.
2. يبعته إلى `register_student_controller`.
3. الكنترولر ينادي `register_student`.
4. السيرفيس:
   - يتأكد إن الإيميل مش موجود قبل كده.
   - لو الجامعة موجودة بالاسم يربط الطالب بها.
   - لو الكلية موجودة داخل نفس الجامعة يربط الطالب بها.
   - يعمل hash للباسورد.
   - يحفظ الطالب في جدول `students`.

الموديل:

```text
src/models/user_model.py
```

الأعمدة المهمة:

- `id`
- `name`
- `email`
- `password`
- `university_id`
- `faculty_id`
- `is_active`
- `created_at`

## تسجيل دخول الطالب

Endpoint:

```text
POST /auth/login
```

Request body:

```json
{
  "email_or_username": "test_student",
  "password": "password123"
}
```

الفلو:

1. يبحث عن الطالب بالإيميل أو الاسم.
2. يقارن الباسورد باستخدام `verify_password`.
3. لو صح يرجع بيانات الطالب.
4. لو غلط يرجع `401 Unauthorized`.

## تسجيل الجامعة

Endpoint:

```text
POST /auth/university/register
```

Request body:

```json
{
  "name": "Tanta University",
  "slug": "tanta-university",
  "country": "Egypt",
  "contact_email": "contact@tanta.edu.eg",
  "password": "password123"
}
```

الفلو:

1. يتأكد إن `contact_email` أو `slug` مش مستخدمين قبل كده.
2. يعمل hash للباسورد.
3. يحفظ الجامعة في جدول `university`.
4. يرجع بيانات الجامعة بدون password.

الموديل:

```text
src/models/university_model.py
```

الأعمدة:

- `id`
- `name`
- `slug`
- `country`
- `contact_email`
- `password`
- `is_active`
- `created_at`

## تسجيل دخول الجامعة

Endpoint:

```text
POST /auth/university/login
```

Request body:

```json
{
  "email_or_username": "tanta-university",
  "password": "password123"
}
```

اللوجين يقبل:

- `contact_email`
- `name`
- `slug`

لو الباسورد صح يرجع بيانات الجامعة.

## رفع ملف Regulation

Endpoint:

```text
POST /data/upload
```

في Postman:

Params:

```text
department_id = 63bf01c6-9605-4257-a920-9cf8da913dc5
title = Sample Regulation
version = 1
```

Body:

```text
form-data
key: file
type: File
value: any .txt or .pdf file selected from Postman
```

الفلو:

1. `routes/data.py` يستقبل request.
2. ينادي `data_controller.upload_controller`.
3. الكنترولر يعمل validation للملف:
   - يتأكد إن `content_type` موجود في `FILE_ALLOWED_TYPES`.
   - يتأكد إن الحجم أقل من `FILE_MAX_SIZE_MB`.
   - ينظف اسم الملف من الرموز الغريبة.
4. ينادي `regulationservice().upload_service`.
5. السيرفيس:
   - ينشئ row في جدول `regulation`.
   - ينشئ row في جدول `document`.
   - يرجع response فيه اسم الملف و `regulation_id`.

Response مثال:

```json
{
  "message": "file_validated_success",
  "file_id": "test_upload.txt",
  "regulation_id": "fa2ccd56-4476-41f6-a4df-46f9f939bada"
}
```

مهم جدًا: `department_id` لازم يكون موجود فعلًا في جدول `department`. لو استخدمت UUID وهمي، PostgreSQL هيرجع ForeignKeyViolation.

## بيانات الاختبار

الملف:

```text
src/insert_test_data.py
```

الغرض منه يعمل seed للآتي:

- University باسم `Tanta`.
- Faculty باسم `Engineering`.
- Department باسم `Computer Engineering`.

تشغيله:

```powershell
cd E:\RGU_mind\website\src
conda run -n rgu python insert_test_data.py
```

بعد التشغيل يطبع:

```text
Use this department_id for upload tests: ...
```

آخر department id تم استخدامه في `api_tests.http`:

```text
63bf01c6-9605-4257-a920-9cf8da913dc5
```

لو قاعدة البيانات اتغيرت أو اتعمل reset، شغل `insert_test_data.py` تاني وخد الـ id الجديد.

## ملفات الاختبار

الملف:

```text
src/api_tests.http
```

فيه requests جاهزة لـ:

- تسجيل طالب.
- لوجين طالب.
- تسجيل جامعة.
- لوجين جامعة.
- upload regulation file.

وفيه متغيرات في أول الملف:

```text
@baseUrl = http://127.0.0.1:5000
@departmentId = 63bf01c6-9605-4257-a920-9cf8da913dc5
```

لو هتجرب upload، لازم تتأكد إن `@departmentId` موجود في جدول `department`.

ملف الرفع التجريبي لم يعد مطلوبًا داخل المشروع. في Postman اختار أي ملف `.txt` أو `.pdf` من جهازك في خانة `file`.

## الموديلات والعلاقات

### University

جدول:

```text
university
```

يمثل الجامعة.

### Faculty

جدول:

```text
faculty
```

مرتبط بجامعة عن طريق:

```text
faculty.university_id -> university.id
```

### Department

جدول:

```text
department
```

مرتبط بكلية عن طريق:

```text
department.faculty_id -> faculty.id
```

### Student

جدول:

```text
students
```

ممكن يرتبط بجامعة وكلية:

```text
students.university_id -> university.id
students.faculty_id -> faculty.id
```

حاليًا الاتنين optional.

### Regulation

جدول:

```text
regulation
```

مرتبط بقسم:

```text
regulation.department_id -> department.id
```

### Document

جدول:

```text
document
```

مرتبط بـ regulation:

```text
document.regulation_id -> regulation.id
```

بيخزن metadata عن الملف:

- `filename`
- `storage_path`
- `file_size_bytes`
- `language`
- `uploaded_at`

ملاحظة: الكود الحالي لا يحفظ الملف فعليًا على disk، هو فقط يسجل metadata في الداتابيز.

### Chunk

جدول:

```text
chunk
```

مصمم لتخزين أجزاء من document لاحقًا:

- `document_id`
- `chunk_index`
- `content`
- `page_ref`

حاليًا لا يوجد فلو فعلي لتقسيم الملفات إلى chunks.

## Security

الملف:

```text
src/helpers/security.py
```

يستخدم `passlib` مع `bcrypt`:

- `hash_password(password)`
- `verify_password(plain_password, hashed_password)`

حاليًا اللوجين يرجع بيانات المستخدم فقط. لا يوجد JWT token فعلي حتى الآن، رغم وجود `AuthResponse` في schemas.

## Enums

الملف:

```text
src/helpers/enums.py
```

فيه:

- `UserType`
- `RegulationStatus`
- `Language`
- `ResponseStatus`
- `FileTypeEnum`

`Regulation.status` يستخدم `RegulationStatus`، والـ upload response يستخدم `ResponseStatus.FILE_VALIDATED_SUCCESS`.

## المشاكل التي اتحلت حتى الآن

### مشكلة PostgreSQL connection refused

كانت تظهر لما Postgres مش شغال على:

```text
localhost:5432
```

الحل: تشغيل postgres container أو التأكد من إعداد `POSTGRES_HOST`.

### مشكلة student register و NULL university_id

كان جدول `students` في الداتابيز القديمة عامل `NOT NULL` على:

```text
university_id
faculty_id
```

لكن الكود بيعتبرهم optional. اتعمل:

- تحديث للموديل.
- Alembic migration داخل `alembic/versions/` لإزالة قيود `NOT NULL` وإضافة `university.country`.

### مشكلة GET بدل POST في Postman/browser

راوت register معمول `POST` فقط، ففتح الرابط من المتصفح كـ `GET` مش هيشتغل.

### مشكلة upload file missing

Postman كان بيرجع:

```text
Field required: file
```

الحل: استخدام Body من نوع `form-data`، وkey اسمه `file` ونوعه `File`.

### مشكلة department foreign key

استخدام UUID وهمي للـ department أدى إلى:

```text
ForeignKeyViolation
```

الحل: إنشاء department حقيقي عن طريق `insert_test_data.py` واستخدام id الحقيقي.

### مشكلة Document field name

في `data_service.py` كان الكود يستخدم:

```text
file_name
```

لكن الموديل اسمه:

```text
filename
```

تم تعديلها.

## ملاحظات مهمة للمطور القادم

- لا تستخدم `department_id` وهمي في upload.
- لو عملت reset للداتابيز، شغل `insert_test_data.py`.
- `create_all()` لا يعمل migrations حقيقية. استخدم `alembic upgrade head` لتطبيق تعديلات schema.
- upload الحالي لا يحفظ الملف فعليًا في فولدر `uploads`، فقط يسجل path في الداتابيز.
- لا يوجد authentication token حتى الآن.
- أسماء بعض الكلاسات/functions محتاجة تنظيف لاحقًا، مثل `regulationservice` الأفضل تكون `RegulationService`.
- فيه imports غير مستخدمة في بعض الملفات ويمكن تنظيفها لاحقًا.

## خطوات تجربة سريعة

1. شغل Postgres.
2. شغل السيرفر:

```powershell
cd E:\RGU_mind\website\src
uvicorn main:app --port 5000 --reload
```

3. جهز بيانات test:

```powershell
conda run -n rgu python insert_test_data.py
```

4. افتح `src/api_tests.http`.
5. تأكد إن `@departmentId` هو نفس id المطبوع من seed.
6. جرب requests بالترتيب.

## الحالة الحالية

المشروع حاليًا يصلح كـ backend prototype فيه:

- Auth بسيط للطالب والجامعة.
- Database models أساسية.
- Upload metadata flow.
- Test requests جاهزة.
- Seed data للـ upload.

الخطوات المنطقية القادمة:

- إضافة JWT authentication.
- تنظيم migrations القادمة باستخدام Alembic بدل أي تعديل يدوي مباشر على الداتابيز.
- حفظ الملف فعليًا في storage.
- إضافة APIs لإرجاع universities/faculties/departments.
- إضافة معالجة أخطاء أفضل في upload بدل ظهور stack trace.
- إضافة tests آلية.
