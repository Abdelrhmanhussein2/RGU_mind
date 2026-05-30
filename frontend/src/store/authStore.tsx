import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { AuthUser, getMe } from "../services/authService";

export type Role = "student" | "university";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: "LOGIN"; payload: { user: AuthUser; token: string } }
  | { type: "LOGOUT" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN": {
      const { user, token } = action.payload;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return { user, token, role: user.role, isAuthenticated: true };
    }
    case "LOGOUT": {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return { user: null, token: null, role: null, isAuthenticated: false };
    }
    default:
      return state;
  }
}

function buildInitialState(): AuthState {
  const token = localStorage.getItem("token");
  const user = getMe();
  if (token && user) {
    return { user, token, role: user.role, isAuthenticated: true };
  }
  return { user: null, token: null, role: null, isAuthenticated: false };
}

interface AuthContextValue {
  state: AuthState;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, undefined, buildInitialState);

  const login = (user: AuthUser, token: string) =>
    dispatch({ type: "LOGIN", payload: { user, token } });

  const logout = () => dispatch({ type: "LOGOUT" });

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
