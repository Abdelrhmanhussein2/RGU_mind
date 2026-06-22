# Backend Integration Guide — New Features

This document covers the features added on top of the existing auth/chat/regulation-upload system:
extended Student Registration, Student Academic Profile (Overview / Grades History / GPA Calculator /
My Info), Notifications, Admin Dashboard, Admin Auth, and the `admin` role.

Everything described here is **currently mocked in the browser via `localStorage`**. Nothing in
`src/services/` was touched — these features don't yet call `api.ts`/axios. Search the codebase for
`🔌 BACKEND` and `🔌 EMAIL` to find every integration point; they're also listed exhaustively below.

---

## 1. New Routes

| Route | Component | Role required | Notes |
|---|---|---|---|
| `/student/academic-profile` | `StudentAcademicProfile` | `student` | 4 tabs: Overview / Grades History / GPA Calculator / My Info |
| `/admin/signin` | `AdminSignIn` | public | Step 1 of admin login (email+password) |
| `/admin/verify-otp` | `AdminOtpVerification` | public | Step 2 — OTP, then logs in and redirects to `/admin` |
| `/admin` | `AdminDashboard` | `admin` | Pending / Approved / Rejected / Settings |

Registered in [src/app/routes.ts](src/app/routes.ts).

---

## 2. Auth changes — the new `admin` role

- `Role` in [src/store/authStore.tsx](src/store/authStore.tsx) is now `"student" | "university" | "admin"`.
- **`src/services/authService.ts` was deliberately NOT touched** (per the "don't touch services/" rule for this
  task). Its `AuthUser.role` is still typed `"student" | "university"`. To allow an admin user object without
  editing that file, `authStore.tsx` defines its own widened type:

  ```ts
  import { AuthUser as BaseAuthUser, getMe } from "../services/authService";
  export interface AuthUser extends Omit<BaseAuthUser, "role"> {
    role: Role; // "student" | "university" | "admin"
  }
  ```

  **When you implement real admin auth on the backend**, also widen `Role`/`AuthUser.role` in
  `authService.ts` itself, then this shim in `authStore.tsx` can be deleted and everything will just
  use the service's own types again.

- `ProtectedRoute.tsx` did **not** change behavior — it already compared `state.role !== requiredRole`
  generically, so `requiredRole="admin"` works without modification. (I tried making the redirect
  role-aware, i.e. redirecting to `/admin/signin` instead of `/`, but reverted it — it broke two existing
  tests in `ProtectedRoute.test.tsx` that assert a redirect to `/`. If you want role-aware redirects,
  that test needs updating first.)

- Admin login is a **two-step mock flow**, mirroring the OTP UX already used for University password
  reset, but used here as a second factor at login time:
  1. `AdminSignIn.tsx` — email/password form → on submit, navigates to `/admin/verify-otp` (no real
     validation yet).
  2. `AdminOtpVerification.tsx` — 6-digit OTP (accepts any 6 digits, same as the existing Student/University
     OTP screens) → calls `useAuth().login()` with a hardcoded `{ id: "admin-1", name: "Platform Admin",
     email, role: "admin" }` and a fake token, then redirects to `/admin`.

---

## 3. Endpoints to implement (every `🔌 BACKEND` / `🔌 EMAIL` marker)

### Student Registration — `src/app/pages/auth/StudentRegister.tsx`

Registration now collects extra academic fields beyond the original name/university/email/password
(Faculty, Department, Student ID, Enrollment Year, Expected Graduation Year — required; an optional
"Academic Plan Details" collapsible with credit-hour totals and a curriculum PDF upload). These are
saved separately from the `registerStudent()` auth call, via the new `studentProfile.ts` lib:

| Marker location | Method & path | Purpose |
|---|---|---|
| `StudentRegister.tsx` `handleSubmit`, calling `createStudentProfile()` | `POST /student/profile` | Saves the profile fields gathered at registration |

### Student Academic Profile — `src/app/lib/{termGrades,resultImages,studentProfile,academicStanding}.ts`

The single combined `academicProfile.ts` from the previous iteration has been **replaced** by four
focused lib modules, because Term Grades is now the single source of truth that Overview, GPA
Calculator, and Graduation Eligibility all derive from — result images and registration profile data
are separate, decoupled concerns:

| Lib file | Marker location | Method & path | Purpose |
|---|---|---|---|
| `studentProfile.ts` | `getStudentProfile()` | `GET /student/profile` | Registration + academic-plan profile (read on every visit to the page) |
| `studentProfile.ts` | `createStudentProfile()` | `POST /student/profile` | Same endpoint as the registration marker above |
| `studentProfile.ts` | `updateStudentProfile()` | `PUT /student/profile` | Used by the "My Info" tab's "Save Changes" button |
| `termGrades.ts` | `getTermGrades()` | `GET /student/term-grades` | The student's saved terms + courses — **this is the GPA engine's data source** |
| `termGrades.ts` | `addTermGrades()` | `POST /student/term-grades` | Saves a new term (term name + dynamically-added courses) |
| `resultImages.ts` | `getResultImages()` | `GET /student/result-images` | Official result photos (decoupled from term grades — no courses attached) |
| `resultImages.ts` | `addResultImage()` | `POST /student/result-images` | Saves a term name + one result photo |
| `academicStanding.ts` | `checkGraduationEligibility()` | `GET /student/graduation-check` | Server-side validation should mirror this function's logic exactly (see below) |

No `🔌 BACKEND` marker exists yet for `deleteTermGrades()`, `deleteCourseFromTerm()`, or
`deleteResultImage()` — add `DELETE` endpoints for these when you wire the page up for real.

```ts
// studentProfile.ts
export interface StudentProfile {
  fullName: string;
  studentId: string;
  university: string;
  faculty: string;
  department: string;
  enrollmentYear: number;
  expectedGraduationYear: number;
  totalRequiredCreditHours: number;
  mandatoryCreditHours: number;
  electiveCreditHours: number;
  majorCreditHours: number;
  curriculumPdfName?: string;
  curriculumPdfBase64?: string; // data: URL — same upload caveat as result images, see below
}

// termGrades.ts
export interface TermGrades {
  id: string;
  termName: string;
  createdDate: string; // ISO string
  courses: Course[];
}

export interface Course {
  id: string;
  courseName: string;
  creditHours: number;
  grade: GradeLetter; // "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "F"
}

// resultImages.ts
export interface ResultImage {
  id: string;
  termName: string;
  uploadDate: string; // ISO string
  imageBase64: string; // data: URL — official result photo
}
```

**Important:** `imageBase64` / `curriculumPdfBase64` are currently full base64 data URLs stored directly
in `localStorage`. For a real backend, these should become real file uploads (multipart) returning a
URL/key instead — the frontend will need a small change to upload the file and store the returned URL
in that field's place rather than the raw base64 string. Flag this to whoever owns the API contract
before building the endpoints.

**GPA formula** (server-side `/student/graduation-check` must match this exactly):
`GPA = Σ(grade_points × credit_hours) / Σ(credit_hours)`, with grade points:
`A+=4.0, A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, C-=1.7, D+=1.3, D=1.0, F=0.0`
(see `GRADE_POINTS` in `termGrades.ts`).

**Graduation eligibility logic** (`academicStanding.ts` → `checkGraduationEligibility()`), so the
backend can reproduce identical results:
- `passedHours` = sum of credit hours for all courses across all terms where `grade !== "F"`.
- `hoursCheck` = `passedHours >= profile.totalRequiredCreditHours` (and `totalRequiredCreditHours > 0`).
- `gpaCheck` = cumulative GPA across **all** terms/courses is `>= 2.0` (requires at least one course).
- `mandatoryCheck` — courses aren't tagged mandatory/elective/major, so there's no real curriculum
  tracking yet. As a stand-in, `getRemainingBreakdown()` allocates `passedHours` proportionally across
  the three category totals from the student's profile (each category's share of
  `totalRequiredCreditHours`); `mandatoryCheck` is true once the mandatory share's remaining hours
  rounds to 0. **This is a placeholder approximation, not real degree-requirement tracking** — once the
  curriculum PDF is actually parsed (or courses get tagged by category), replace this with a real check.
- `eligible` = all three checks pass. `status` is `"green"` if eligible, `"yellow"` if not eligible but
  `hoursCheck` is the only failing check and `remainingHours <= 12`, otherwise `"red"`.
- Academic Standing badge thresholds (`calculateStanding()`): GPA `>= 3.5` → Excellent, `>= 3.0` → Good,
  `>= 2.0` → Satisfactory, `< 2.0` → Academic Warning, no courses recorded anywhere → "Not calculated yet".

### Notifications — `src/app/lib/notifications.ts`

| Marker location | Method & path | Purpose |
|---|---|---|
| `getNotifications()` | `GET /notifications` | List notifications for the logged-in student |
| (bottom of file) | `🔌 EMAIL` | When a university updates a regulation, trigger an email to affected students |

No `PATCH`/mark-read endpoint marker exists yet — `markNotificationRead()` and
`markAllNotificationsRead()` currently only mutate `localStorage`. Add something like
`PATCH /notifications/:id/read` and `PATCH /notifications/read-all` when ready.

```ts
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
}
```

### Admin Dashboard — `src/app/lib/adminRegulations.ts`

| Marker location | Method & path | Purpose |
|---|---|---|
| `getRegulations()` | `GET /admin/regulations/pending` | List regulation submissions (despite the name, the mock returns all statuses — pending/approved/rejected — and the UI filters client-side; decide whether the real endpoint should do the same or split into separate calls) |
| `approveRegulation()` | `POST /admin/regulations/:id/approve` | Approve a pending submission |
| `rejectRegulation()` | `POST /admin/regulations/:id/reject` | Reject with a reason: `{ reason: string }` |

```ts
export interface RegulationSubmission {
  id: string;
  universityName: string;
  documentName: string;
  uploadDate: string;       // ISO string
  fileType: string;         // e.g. "pdf"
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  reviewedDate?: string;    // ISO string, set on approve/reject
}
```

### Admin Auth — `src/app/pages/auth/AdminSignIn.tsx` / `AdminOtpVerification.tsx`

| Marker location | Method & path | Purpose |
|---|---|---|
| `AdminSignIn.tsx` `handleSubmit` | `POST /admin/auth/login { email, password }` | Should trigger an OTP email/SMS to the admin and return enough to proceed to step 2 (no token yet) |
| `AdminOtpVerification.tsx` `handleSubmit` | `POST /admin/auth/verify-otp { email, otp }` → `{ token, user }` | Completes login. `user` should match `AuthUser` shape: `{ id, name, email, role: "admin" }` |

### Admin Settings — `src/app/pages/AdminDashboard.tsx`

| Marker location | Method & path | Purpose |
|---|---|---|
| Settings tab, "Save Changes" button | `PUT /admin/profile` | Update admin's `name`/`email`. Currently the button has no `onClick` wired to a save call — it just edits local state. |

---

## 4. Current `localStorage` keys (so you know what to retire once endpoints exist)

| Key | Set by | Shape |
|---|---|---|
| `regumind_student_profile` | `studentProfile.ts` | `StudentProfile` |
| `regumind_term_grades` | `termGrades.ts` | `TermGrades[]` |
| `regumind_result_images` | `resultImages.ts` | `ResultImage[]` |
| `regumind_notifications` | `notifications.ts` | `NotificationItem[]` |
| `regumind_admin_regulations` | `adminRegulations.ts` | `RegulationSubmission[]` |
| `token`, `user` | `authStore.tsx` (existing, unchanged) | JWT string / `AuthUser` JSON |

Unlike the previous iteration, `studentProfile.ts`/`termGrades.ts`/`resultImages.ts` are **not**
seeded with mock data — they start empty (`EMPTY_STUDENT_PROFILE`, `[]`, `[]`) so a fresh registration
flows naturally into an empty Academic Profile. `notifications.ts` and `adminRegulations.ts` still seed
mock data on first read (see their `SEED` constants) — that's purely so those two pages aren't empty
during frontend development and should disappear once real `GET` calls replace `getNotifications()`/
`getRegulations()`.

---

## 5. What's intentionally still a stub

- Admin OTP accepts any 6-digit code (identical behavior to the existing Student/University OTP
  screens — this was already the pattern in this codebase, not something new I introduced).
- `deleteTermGrades()`, `deleteCourseFromTerm()`, `deleteResultImage()`, notification mark-read, and
  admin profile save have no `🔌 BACKEND` marker / endpoint designed yet — add `DELETE`/`PATCH`/`PUT`
  endpoints as needed when you wire these up.
- Result images and the curriculum PDF are stored as raw base64 in `localStorage`, not uploaded
  anywhere — needs real file upload endpoints before this can leave mock mode (see note under Academic
  Profile above).
- `mandatoryCheck` in `checkGraduationEligibility()` is a proportional-allocation approximation, not
  real per-course category tracking (see the Graduation Eligibility note above) — flagged as the
  biggest semantic gap to close once there's real curriculum data to check against.
