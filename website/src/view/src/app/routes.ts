import { createElement } from "react";
import { createBrowserRouter } from "react-router";
import { Landing } from "./pages/Landing";
import { UniversityDashboard } from "./pages/UniversityDashboard";
import { StudentChat } from "./pages/StudentChat";
import { StudentAcademicProfile } from "./pages/StudentAcademicProfile";
import { AdminDashboard } from "./pages/AdminDashboard";

// Student Authentication Pages
import { StudentSignIn } from "./pages/auth/StudentSignIn";
import { StudentRegister } from "./pages/auth/StudentRegister";
import { StudentForgotPassword } from "./pages/auth/StudentForgotPassword";
import { StudentOtpVerification } from "./pages/auth/StudentOtpVerification";
import { StudentResetPassword } from "./pages/auth/StudentResetPassword";

// University Authentication Pages
import { UniversitySignIn } from "./pages/auth/UniversitySignIn";
import { UniversityRegister } from "./pages/auth/UniversityRegister";
import { UniversityForgotPassword } from "./pages/auth/UniversityForgotPassword";
import { UniversityOtpVerification } from "./pages/auth/UniversityOtpVerification";
import { UniversityResetPassword } from "./pages/auth/UniversityResetPassword";

// Admin Authentication Pages
import { AdminSignIn } from "./pages/auth/AdminSignIn";
import { AdminOtpVerification } from "./pages/auth/AdminOtpVerification";

// Protected Route wrapper
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const studentChat = createElement(
  ProtectedRoute,
  { requiredRole: "student" },
  createElement(StudentChat)
);

const studentAcademicProfile = createElement(
  ProtectedRoute,
  { requiredRole: "student" },
  createElement(StudentAcademicProfile)
);

const universityDashboard = createElement(
  ProtectedRoute,
  { requiredRole: "university" },
  createElement(UniversityDashboard)
);

const adminDashboard = createElement(
  ProtectedRoute,
  { requiredRole: "admin" },
  createElement(AdminDashboard)
);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },

  // Student Auth Routes (public)
  {
    path: "/student/signin",
    Component: StudentSignIn,
  },
  {
    path: "/student/register",
    Component: StudentRegister,
  },
  {
    path: "/student/forgot-password",
    Component: StudentForgotPassword,
  },
  {
    path: "/student/verify-otp",
    Component: StudentOtpVerification,
  },
  {
    path: "/student/reset-password",
    Component: StudentResetPassword,
  },

  // Student Protected Routes
  {
    path: "/student/chat",
    element: studentChat,
  },
  {
    path: "/student/academic-profile",
    element: studentAcademicProfile,
  },

  // University Auth Routes (public)
  {
    path: "/university/signin",
    Component: UniversitySignIn,
  },
  {
    path: "/university/register",
    Component: UniversityRegister,
  },
  {
    path: "/university/forgot-password",
    Component: UniversityForgotPassword,
  },
  {
    path: "/university/verify-otp",
    Component: UniversityOtpVerification,
  },
  {
    path: "/university/reset-password",
    Component: UniversityResetPassword,
  },

  // University Protected Routes
  {
    path: "/university",
    element: universityDashboard,
  },

  // Admin Auth Routes (public)
  {
    path: "/admin/signin",
    Component: AdminSignIn,
  },
  {
    path: "/admin/verify-otp",
    Component: AdminOtpVerification,
  },

  // Admin Protected Routes
  {
    path: "/admin",
    element: adminDashboard,
  },
]);
