import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../../store/authStore";
import type { Role } from "../../../store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: Role;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (state.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
