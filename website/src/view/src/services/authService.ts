import api from "./api";

export type Role = "student" | "university";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// 🔌 BACKEND: POST /auth/login  { email_or_username, password }
// ⚠️ SHAPE MISMATCH: backend field is `email_or_username`, not `email`
// ⚠️ RESPONSE MISMATCH: backend returns { message, user: { id, name, email } }
//    — no `token` (JWT not yet implemented) and no `role` field
export async function loginStudent(
  email: string,
  password: string
): Promise<AuthResponse> {
  void api; // will be used when backend is ready
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          token: "mock-student-token",
          user: { id: "s1", name: "Student User", email, role: "student" },
        }),
      500
    )
  );
}

// 🔌 BACKEND: POST /auth/university/login  { email_or_username, password }
// ⚠️ SHAPE MISMATCH: backend field is `email_or_username`, not `email`
// ⚠️ RESPONSE MISMATCH: backend returns { message, user: { id, name, slug, country, contact_email } }
//    — no `token` (JWT not yet implemented), no `role`, and `email` is `contact_email`
export async function loginUniversity(
  email: string,
  password: string
): Promise<AuthResponse> {
  void api;
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          token: "mock-university-token",
          user: { id: "u1", name: "University Admin", email, role: "university" },
        }),
      500
    )
  );
}

// 🔌 BACKEND: POST /auth/register  { username, email, password, university_name?, faculty? }
// ⚠️ SHAPE MISMATCH: backend field is `username` not `name`, `university_name` not `university`
// ⚠️ RESPONSE MISMATCH: backend returns { message, user: { id, name, email, university_id, faculty_id } }
//    — no `token` (JWT not yet implemented) and no `role`
export async function registerStudent(
  name: string,
  university: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  void api;
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          token: "mock-student-token",
          user: { id: "s1", name, email, role: "student" },
        }),
      500
    )
  );
}

// 🔌 BACKEND: POST /auth/university/register  { name, slug, country, contact_email, password }
// ⚠️ SHAPE MISMATCH: backend expects { name, slug, country, contact_email, password }
//    Frontend collects: universityName→name, officialEmail→contact_email, password→password
//    universityCode→slug (mapping needed), governorate→country (mapping needed)
//    `deanName` has NO backend field — backend schema doesn't include it
// ⚠️ RESPONSE MISMATCH: backend returns { message, user: { id, name, slug, country, contact_email } }
//    — no `token` (JWT not yet implemented) and no `role`
export async function registerUniversity(
  universityName: string,
  officialEmail: string,
  universityCode: string,
  deanName: string,
  governorate: string,
  password: string
): Promise<AuthResponse> {
  void api;
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          token: "mock-university-token",
          user: {
            id: "u1",
            name: universityName,
            email: officialEmail,
            role: "university",
          },
        }),
      500
    )
  );
}

// 🔌 BACKEND: POST /auth/forgot-password  { email, role }  ⚠️ NOT YET IMPLEMENTED in backend
export async function forgotPassword(email: string, role: Role): Promise<void> {
  void api;
  return new Promise((resolve) => setTimeout(resolve, 500));
}

// 🔌 BACKEND: POST /auth/verify-otp  { email, otp, role }  ⚠️ NOT YET IMPLEMENTED in backend
export async function verifyOtp(
  email: string,
  otp: string,
  role: Role
): Promise<void> {
  void api;
  return new Promise((resolve) => setTimeout(resolve, 500));
}

// 🔌 BACKEND: POST /auth/reset-password  { email, newPassword, role }  ⚠️ NOT YET IMPLEMENTED in backend
export async function resetPassword(
  email: string,
  newPassword: string,
  role: Role
): Promise<void> {
  void api;
  return new Promise((resolve) => setTimeout(resolve, 500));
}

// Clears local session — no server call needed for JWT (server-side blacklisting is optional)
export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Returns the cached user from localStorage without a network call.
// 🔌 BACKEND: optionally GET /auth/me to validate the session server-side
export function getMe(): AuthUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
