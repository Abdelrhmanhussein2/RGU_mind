import api from "./api";

export type Role = "student" | "university" | "admin";

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

export async function loginStudent(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post("/auth/login", {
    email_or_username: email,
    password: password,
  });
  return {
    token: response.data.token,
    user: response.data.user,
  };
}

export async function loginUniversity(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post("/auth/university/login", {
    email_or_username: email,
    password: password,
  });
  return {
    token: response.data.token,
    user: response.data.user,
  };
}

export async function registerStudent(
  name: string,
  university: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post("/auth/register", {
    username: name,
    email: email,
    password: password,
    university_name: university,
  });
  return {
    token: response.data.token,
    user: response.data.user,
  };
}

export async function registerUniversity(
  universityName: string,
  officialEmail: string,
  universityCode: string,
  deanName: string,
  governorate: string,
  password: string
): Promise<AuthResponse> {
  const formData = new FormData();
  formData.append("name", universityName);
  formData.append("slug", universityCode);
  formData.append("country", governorate);
  formData.append("contact_email", officialEmail);
  formData.append("password", password);

  // Send a dummy file to satisfy backend verification_file requirement
  const dummyFile = new Blob(["Verification document details for Dean " + deanName], { type: "text/plain" });
  formData.append("verification_file", dummyFile, "verification.txt");

  const response = await api.post("/auth/university/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return {
    token: response.data.token,
    user: response.data.user,
  };
}

export async function forgotPassword(email: string, role: Role): Promise<void> {
  // Not yet implemented on backend, fallback to success mock
  return new Promise((resolve) => setTimeout(resolve, 500));
}

export async function verifyOtp(
  email: string,
  otp: string,
  role: Role
): Promise<void> {
  // Not yet implemented on backend, fallback to success mock
  return new Promise((resolve) => setTimeout(resolve, 500));
}

export async function resetPassword(
  email: string,
  newPassword: string,
  role: Role
): Promise<void> {
  // Not yet implemented on backend, fallback to success mock
  return new Promise((resolve) => setTimeout(resolve, 500));
}

export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getMe(): AuthUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
