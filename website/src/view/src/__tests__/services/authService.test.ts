import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loginStudent,
  loginUniversity,
  registerStudent,
  forgotPassword,
  verifyOtp,
  logout,
} from '@/services/authService';

// Use fake timers so the 500ms mocks resolve instantly
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn((url, data) => {
      if (url === '/auth/login') {
        return Promise.resolve({
          data: {
            token: 'mock-student-token',
            user: {
              id: '1',
              name: 'Alice',
              email: data.email_or_username,
              role: 'student'
            }
          }
        });
      }
      if (url === '/auth/university/login') {
        return Promise.resolve({
          data: {
            token: 'mock-university-token',
            user: {
              id: '2',
              name: 'Test Uni',
              email: data.email_or_username,
              role: 'university'
            }
          }
        });
      }
      if (url === '/auth/register') {
        return Promise.resolve({
          data: {
            token: 'mock-student-token',
            user: {
              id: '1',
              name: data.username,
              email: data.email,
              role: 'student'
            }
          }
        });
      }
      return Promise.reject(new Error('Unknown url'));
    }),
  }
}));

describe('loginStudent', () => {
  it('returns a token', async () => {
    const promise = loginStudent('student@uni.edu', 'pass');
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.token).toBe('mock-student-token');
  });

  it('returns a user with role=student and the submitted email', async () => {
    const promise = loginStudent('alice@uni.edu', 'pass');
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.user.role).toBe('student');
    expect(result.user.email).toBe('alice@uni.edu');
  });
});

describe('loginUniversity', () => {
  it('returns a token', async () => {
    const promise = loginUniversity('admin@uni.edu', 'pass');
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.token).toBe('mock-university-token');
  });

  it('returns a user with role=university', async () => {
    const promise = loginUniversity('admin@uni.edu', 'pass');
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.user.role).toBe('university');
  });
});

describe('registerStudent', () => {
  it('resolves successfully', async () => {
    const promise = registerStudent('Alice', 'Test Uni', 'alice@uni.edu', 'pass123');
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.user.role).toBe('student');
    expect(result.token).toBeDefined();
  });
});

describe('forgotPassword', () => {
  it('resolves successfully for student role', async () => {
    const promise = forgotPassword('alice@uni.edu', 'student');
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeUndefined();
  });

  it('resolves successfully for university role', async () => {
    const promise = forgotPassword('admin@uni.edu', 'university');
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeUndefined();
  });
});

describe('verifyOtp', () => {
  it('resolves successfully', async () => {
    const promise = verifyOtp('alice@uni.edu', '123456', 'student');
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeUndefined();
  });
});

describe('logout', () => {
  it('removes token and user from localStorage', () => {
    localStorage.setItem('token', 'some-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', role: 'student' }));
    logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('is safe to call when localStorage is already empty', () => {
    expect(() => logout()).not.toThrow();
  });
});
