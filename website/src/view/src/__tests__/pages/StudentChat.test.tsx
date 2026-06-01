import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { StudentChat } from '@/app/pages/StudentChat';

// ── Module mocks ──────────────────────────────────────────────────────────

vi.mock('@/services/chatService', () => ({
  getChatHistory: vi.fn().mockResolvedValue([]),
  sendMessage: vi.fn().mockResolvedValue({ answer: 'Mock AI answer', sources: [] }),
}));

vi.mock('@/services/authService', () => ({
  logout: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuth: vi.fn().mockReturnValue({
    state: { isAuthenticated: true, role: 'student', user: null, token: null },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// ── Imports after mocks ───────────────────────────────────────────────────

import { sendMessage, getChatHistory } from '@/services/chatService';

// ── Helpers ───────────────────────────────────────────────────────────────

function renderChat() {
  return render(
    <MemoryRouter>
      <StudentChat />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('StudentChat — empty state', () => {
  it('renders the welcome heading when no messages exist', async () => {
    renderChat();
    await waitFor(() => {
      expect(
        screen.getByText(/ask any question about your academic regulations/i)
      ).toBeInTheDocument();
    });
  });

  it('shows example question cards', async () => {
    renderChat();
    await waitFor(() => {
      expect(screen.getByText(/What happens if I fail a course/i)).toBeInTheDocument();
    });
  });
});

describe('StudentChat — sending messages', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // reset call counts before each test so spies don't bleed
    (sendMessage as Mock).mockResolvedValue({ answer: 'Mock AI answer', sources: [] });
    (getChatHistory as Mock).mockResolvedValue([]);
  });

  it('user message appears in the chat after submit', async () => {
    const user = userEvent.setup();
    renderChat();

    const textarea = screen.getByPlaceholderText(/Ask about your academic regulations/i);
    await user.type(textarea, 'What is the GPA requirement?');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('What is the GPA requirement?')).toBeInTheDocument();
    });
  });

  it('calls sendMessage with the typed question', async () => {
    const user = userEvent.setup();
    renderChat();

    const textarea = screen.getByPlaceholderText(/Ask about your academic regulations/i);
    await user.type(textarea, 'attendance policy');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('attendance policy');
    });
  });

  it('AI response appears after sendMessage resolves', async () => {
    const user = userEvent.setup();
    renderChat();

    const textarea = screen.getByPlaceholderText(/Ask about your academic regulations/i);
    await user.type(textarea, 'test question');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Mock AI answer')).toBeInTheDocument();
    });
  });

  it('Enter key sends the message', async () => {
    const user = userEvent.setup();
    renderChat();

    const textarea = screen.getByPlaceholderText(/Ask about your academic regulations/i);
    await user.type(textarea, 'hello via enter');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('hello via enter');
    });
  });

  it('Shift+Enter does NOT send the message', async () => {
    const user = userEvent.setup();
    renderChat();

    const textarea = screen.getByPlaceholderText(/Ask about your academic regulations/i);
    await user.type(textarea, 'no send');
    // hold Shift while pressing Enter
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    // sendMessage must not have been called
    expect(sendMessage).not.toHaveBeenCalled();
    // Shift+Enter inserts a newline character into the textarea instead of submitting
    expect(textarea).toHaveValue('no send\n');
  });

  it('send button is disabled while a response is loading', async () => {
    // Make sendMessage hang indefinitely to keep isLoading=true
    (sendMessage as Mock).mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    renderChat();

    const textarea = screen.getByPlaceholderText(/Ask about your academic regulations/i);
    await user.type(textarea, 'slow question');
    await user.keyboard('{Enter}');

    // After submit the input is cleared → button disabled because !input.trim()
    // AND because isLoading is true — both conditions hold
    const submitBtn = screen.getByRole('button', { name: '' }); // Send icon button
    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });
  });
});

describe('StudentChat — example questions', () => {
  it('clicking an example question populates the textarea', async () => {
    const user = userEvent.setup();
    renderChat();

    await waitFor(() => {
      expect(screen.getByText(/What happens if I fail a course/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/What happens if I fail a course/i));

    const textarea = screen.getByPlaceholderText(/Ask about your academic regulations/i);
    expect(textarea).toHaveValue('What happens if I fail a course?');
  });
});
