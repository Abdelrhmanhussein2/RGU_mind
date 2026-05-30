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

// 🔌 BACKEND: POST /auth/student/login  { email, password }
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

// 🔌 BACKEND: POST /auth/university/login  { email, password }
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

// 🔌 BACKEND: POST /auth/student/register  { name, university, email, password }
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

// 🔌 BACKEND: POST /auth/university/register  { universityName, officialEmail, universityCode, deanName, governorate, password }
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

// 🔌 BACKEND: POST /auth/forgot-password  { email, role }
export async function forgotPassword(email: string, role: Role): Promise<void> {
  void api;
  return new Promise((resolve) => setTimeout(resolve, 500));
}

// 🔌 BACKEND: POST /auth/verify-otp  { email, otp, role }
export async function verifyOtp(
  email: string,
  otp: string,
  role: Role
): Promise<void> {
  void api;
  return new Promise((resolve) => setTimeout(resolve, 500));
}

// 🔌 BACKEND: POST /auth/reset-password  { email, newPassword, role }
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
