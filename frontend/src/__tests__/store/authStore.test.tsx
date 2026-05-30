import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/store/authStore';
import type { AuthUser } from '@/services/authService';

const MOCK_USER: AuthUser = {
  id: 'u1',
  name: 'Test User',
  email: 'test@uni.edu',
  role: 'student',
};
const MOCK_TOKEN = 'test-token-abc';

// ── Helper components ──────────────────────────────────────────────────────

function LoginButton() {
  const { login } = useAuth();
  return (
    <button onClick={() => login(MOCK_USER, MOCK_TOKEN)}>Login</button>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>Logout</button>;
}

function AuthStatus() {
  const { state } = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(state.isAuthenticated)}</span>
      <span data-testid="role">{state.role ?? 'none'}</span>
      <span data-testid="token">{state.token ?? 'none'}</span>
    </div>
  );
}

function Wrapper() {
  return (
    <AuthProvider>
      <LoginButton />
      <LogoutButton />
      <AuthStatus />
    </AuthProvider>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('authStore — LOGIN action', () => {
  it('sets isAuthenticated to true', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('sets the correct role', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByTestId('role')).toHaveTextContent('student');
  });

  it('persists the token to localStorage', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(localStorage.getItem('token')).toBe(MOCK_TOKEN);
  });

  it('persists the user object to localStorage', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Login' }));
    const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
    expect(stored.id).toBe(MOCK_USER.id);
    expect(stored.email).toBe(MOCK_USER.email);
  });
});

describe('authStore — LOGOUT action', () => {
  it('sets isAuthenticated to false after logout', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Login' }));
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('clears token from localStorage on LOGOUT', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Login' }));
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('role becomes null after logout', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Login' }));
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(screen.getByTestId('role')).toHaveTextContent('none');
  });
});

describe('authStore — initial state from localStorage', () => {
  it('restores session when token + user exist in localStorage', () => {
    localStorage.setItem('token', MOCK_TOKEN);
    localStorage.setItem('user', JSON.stringify(MOCK_USER));
    render(<Wrapper />);
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('token')).toHaveTextContent(MOCK_TOKEN);
  });
});

describe('useAuth outside provider', () => {
  it('throws with a descriptive error message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const BadComponent = () => { useAuth(); return null; };
    expect(() => render(<BadComponent />)).toThrow(
      'useAuth must be used inside <AuthProvider>'
    );
    consoleSpy.mockRestore();
  });
});
