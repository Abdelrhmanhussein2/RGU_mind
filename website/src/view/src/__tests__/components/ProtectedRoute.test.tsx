import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ProtectedRoute } from '@/app/components/auth/ProtectedRoute';
import { useAuth } from '@/store/authStore';

vi.mock('@/store/authStore', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as Mock;

function makeRouter(requiredRole: 'student' | 'university') {
  return createMemoryRouter(
    [
      {
        path: '/protected',
        element: (
          <ProtectedRoute requiredRole={requiredRole}>
            <div>Protected Content</div>
          </ProtectedRoute>
        ),
      },
      { path: '/', element: <div>Home Page</div> },
    ],
    { initialEntries: ['/protected'] }
  );
}

describe('ProtectedRoute', () => {
  it('redirects to "/" when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: false, role: null },
    });
    render(<RouterProvider router={makeRouter('student')} />);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated with the correct role', () => {
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: true, role: 'student' },
    });
    render(<RouterProvider router={makeRouter('student')} />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
  });

  it('redirects to "/" when authenticated but with the wrong role', () => {
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: true, role: 'university' },
    });
    render(<RouterProvider router={makeRouter('student')} />);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders university content when role matches university', () => {
    mockUseAuth.mockReturnValue({
      state: { isAuthenticated: true, role: 'university' },
    });
    render(<RouterProvider router={makeRouter('university')} />);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
