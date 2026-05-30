# ReguMind Routes Quick Reference

## Complete Route Map

### Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Landing | Main landing page with role selection |

---

## Student Routes

### Authentication Flow

| Route | Component | Purpose | Next Step |
|-------|-----------|---------|-----------|
| `/student/signin` | StudentSignIn | Student login page | → `/student/chat` |
| `/student/register` | StudentRegister | New student registration | → `/student/chat` |
| `/student/forgot-password` | StudentForgotPassword | Request password reset | → `/student/verify-otp` |
| `/student/verify-otp` | StudentOtpVerification | Verify 6-digit OTP | → `/student/reset-password` |
| `/student/reset-password` | StudentResetPassword | Set new password | → `/student/signin` |

### Application

| Route | Component | Description |
|-------|-----------|-------------|
| `/student/chat` | StudentChat | Main chat interface with AI assistant |
| `/student/auth` | StudentAuth | Legacy auth page (deprecated) |

---

## University Routes

### Authentication Flow

| Route | Component | Purpose | Next Step |
|-------|-----------|---------|-----------|
| `/university/signin` | UniversitySignIn | University login page | → `/university` |
| `/university/register` | UniversityRegister | Register new institution | → `/university` |
| `/university/forgot-password` | UniversityForgotPassword | Request password reset | → `/university/verify-otp` |
| `/university/verify-otp` | UniversityOtpVerification | Verify 6-digit OTP | → `/university/reset-password` |
| `/university/reset-password` | UniversityResetPassword | Set new password | → `/university/signin` |

### Application

| Route | Component | Description |
|-------|-----------|-------------|
| `/university` | UniversityDashboard | Upload regulations and manage content |

---

## Navigation Flow Diagrams

### Student Authentication Journey

```
Landing Page (/)
    │
    ├─ Click "I am a Student"
    │
    ▼
Student Sign In (/student/signin)
    │
    ├─ New User? → Student Register (/student/register) → Chat
    │                                                       
    ├─ Forgot Password? → Forgot Password (/student/forgot-password)
    │                           │
    │                           ▼
    │                     OTP Verification (/student/verify-otp)
    │                           │
    │                           ▼
    │                     Reset Password (/student/reset-password)
    │                           │
    │                           ▼
    │                     Back to Sign In
    │
    ▼
Student Chat (/student/chat)
```

### University Authentication Journey

```
Landing Page (/)
    │
    ├─ Click "I am a University"
    │
    ▼
University Sign In (/university/signin)
    │
    ├─ New Institution? → University Register (/university/register) → Dashboard
    │                                                       
    ├─ Forgot Password? → Forgot Password (/university/forgot-password)
    │                           │
    │                           ▼
    │                     OTP Verification (/university/verify-otp)
    │                           │
    │                           ▼
    │                     Reset Password (/university/reset-password)
    │                           │
    │                           ▼
    │                     Back to Sign In
    │
    ▼
University Dashboard (/university)
```

---

## Color Themes by Route Type

| Route Pattern | Gradient Theme | Primary Color |
|---------------|----------------|---------------|
| `/student/*` | Indigo → Purple → Indigo | `#4f46e5` (Indigo-600) |
| `/university/*` | Purple → Indigo → Purple | `#9333ea` (Purple-600) |
| `/` (Landing) | Indigo-50 → White → Purple-50 | Mixed |

---

## Quick Test URLs

### Development Testing Routes

**Student Flow:**
- Start: `http://localhost:5173/student/signin`
- Register: `http://localhost:5173/student/register`
- Recovery: `http://localhost:5173/student/forgot-password`

**University Flow:**
- Start: `http://localhost:5173/university/signin`
- Register: `http://localhost:5173/university/register`
- Recovery: `http://localhost:5173/university/forgot-password`

**General:**
- Home: `http://localhost:5173/`
- Student Chat: `http://localhost:5173/student/chat`
- University Dashboard: `http://localhost:5173/university`

---

## Route Protection (To Be Implemented)

### Protected Routes (Require Authentication)
- `/student/chat` - Should redirect to `/student/signin` if not authenticated
- `/university` - Should redirect to `/university/signin` if not authenticated

### Public Routes
- `/`
- `/student/signin`
- `/student/register`
- `/student/forgot-password`
- `/student/verify-otp`
- `/student/reset-password`
- `/university/signin`
- `/university/register`
- `/university/forgot-password`
- `/university/verify-otp`
- `/university/reset-password`

### Example Protected Route Component

```typescript
// To be implemented
import { Navigate } from "react-router";

function ProtectedRoute({ 
  children, 
  type 
}: { 
  children: React.ReactNode; 
  type: "student" | "university" 
}) {
  const isAuthenticated = checkAuth(); // Implement this
  
  if (!isAuthenticated) {
    return <Navigate to={`/${type}/signin`} replace />;
  }
  
  return <>{children}</>;
}
```

---

## Component File Locations

```
src/app/
├── pages/
│   ├── Landing.tsx                          → /
│   ├── StudentChat.tsx                      → /student/chat
│   ├── UniversityDashboard.tsx              → /university
│   ├── StudentAuth.tsx                      → /student/auth (legacy)
│   └── auth/
│       ├── StudentSignIn.tsx                → /student/signin
│       ├── StudentRegister.tsx              → /student/register
│       ├── StudentForgotPassword.tsx        → /student/forgot-password
│       ├── StudentOtpVerification.tsx       → /student/verify-otp
│       ├── StudentResetPassword.tsx         → /student/reset-password
│       ├── UniversitySignIn.tsx             → /university/signin
│       ├── UniversityRegister.tsx           → /university/register
│       ├── UniversityForgotPassword.tsx     → /university/forgot-password
│       ├── UniversityOtpVerification.tsx    → /university/verify-otp
│       └── UniversityResetPassword.tsx      → /university/reset-password
├── components/
│   └── auth/
│       ├── AuthLayout.tsx                   (Shared layout)
│       └── PasswordStrengthIndicator.tsx    (Shared component)
└── routes.ts                                 (Route configuration)
```

---

## Route State Management

### Routes That Pass State

**Student OTP Verification** receives:
```typescript
location.state = {
  email: string  // From forgot-password page
}
```

**University OTP Verification** receives:
```typescript
location.state = {
  email: string  // From forgot-password page
}
```

### Usage Example

```typescript
// In StudentForgotPassword.tsx
navigate("/student/verify-otp", { state: { email } });

// In StudentOtpVerification.tsx
const location = useLocation();
const email = location.state?.email || "your email";
```

---

## Navigation Helpers

### Back Navigation Patterns

All auth screens include:
```typescript
<button onClick={() => navigate("/")}>
  ← Back to home
</button>
```

Multi-step flows include intermediate back buttons:
- OTP Verification → Back to Forgot Password
- Registration → Link to Sign In
- Sign In → Link to Registration

---

## Route Configuration

The complete route configuration is in `src/app/routes.ts`:

```typescript
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  // 1 Public route
  // 7 Student routes (1 legacy + 6 active)
  // 6 University routes
  // Total: 14 routes
]);
```
