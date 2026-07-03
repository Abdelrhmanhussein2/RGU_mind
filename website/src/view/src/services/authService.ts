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
): Promise<AuthResponse & { dev_otp?: string }> {
  const response = await api.post("/auth/register", {
    username: name,
    email: email,
    password: password,
    university_name: university,
  });
  console.log("Registration Response:", response.data);
  return {
    token: response.data.token,
    user: response.data.user,
    dev_otp: response.data.dev_otp,
  };
}


// 🔌 BACKEND: POST /auth/verify-register-otp { email, role, otp } — backend response is { message },
// not { token, user }; the registration token/user come from registerStudent() and are carried
// forward through navigation state to be used by login() once this verification succeeds.
// 🔌 BACKEND: POST /auth/verify-register-otp { email, role, otp }
export async function verifyRegisterOtp(email: string, otp: string, role: Role): Promise<AuthResponse> {
  const response = await api.post("/auth/verify-register-otp", { email, role, otp });
  return {
    token: response.data.token,
    user: response.data.user
  };
}

// 🔌 BACKEND: POST /auth/resend-register-otp { email, role }
export async function resendRegisterOtp(email: string, role: Role): Promise<void> {
  await api.post("/auth/resend-register-otp", { email, role });
}

export async function registerUniversity(
  universityName: string,
  officialEmail: string,
  universityCode: string,
  deanName: string,
  governorate: string,
  password: string,
  verificationFile: File
): Promise<AuthResponse> {
  const formData = new FormData();
  formData.append("name", universityName);
  formData.append("slug", universityCode);
  formData.append("country", governorate);
  formData.append("contact_email", officialEmail);
  formData.append("password", password);
  formData.append("verification_file", verificationFile);

  const response = await api.post("/auth/university/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return {
    token: response.data.token,
    user: response.data.user,
  };
}

export async function forgotPassword(email: string, role: Role): Promise<void> {
  await api.post("/auth/forgot-password", { email, role });
}

export async function verifyOtp(
  email: string,
  otp: string,
  role: Role
): Promise<void> {
  await api.post("/auth/verify-otp", { email, otp, role });
}

export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string,
  role: Role
): Promise<void> {
  await api.post("/auth/reset-password", { email, otp, new_password: newPassword, role });
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

export async function updateUniversityProfile(name: string, contactEmail: string, password: string): Promise<AuthUser> {
  const response = await api.put("/university/profile", {
    name,
    contact_email: contactEmail,
    password
  });
  
  const user = getMe();
  if (user) {
    user.name = name;
    user.email = contactEmail;
    localStorage.setItem("user", JSON.stringify(user));
  }
  return response.data.user;
}

