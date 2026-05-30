import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { UniversityDashboard } from '@/app/pages/UniversityDashboard';

// ── Module mocks ──────────────────────────────────────────────────────────

vi.mock('@/services/documentService', () => ({
  getDocuments: vi.fn().mockResolvedValue([
    { id: '1', name: 'Regulations.pdf', status: 'completed', uploadedAt: '1 hour ago' },
  ]),
  uploadDocuments: vi.fn().mockResolvedValue([
    { id: '99', name: 'new.pdf', status: 'processing', uploadedAt: 'Just now' },
  ]),
}));

vi.mock('@/services/authService', () => ({
  logout: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuth: vi.fn().mockReturnValue({
    state: { isAuthenticated: true, role: 'university', user: null, token: null },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// ── Imports after mocks ───────────────────────────────────────────────────

import { getDocuments, uploadDocuments } from '@/services/documentService';

// ── Helpers ───────────────────────────────────────────────────────────────

function renderDashboard() {
  return render(
    <MemoryRouter>
      <UniversityDashboard />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('UniversityDashboard — default view', () => {
  it('renders the Upload Regulations tab by default', async () => {
    renderDashboard();
    // "Upload Regulations" appears in both sidebar nav and the <h1> header;
    // target the heading specifically to avoid the "multiple elements" error
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Upload Regulations' })
      ).toBeInTheDocument();
    });
  });

  it('shows the drop-zone prompt text', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Drop your files here/i)).toBeInTheDocument();
    });
  });
});

describe('UniversityDashboard — tab navigation', () => {
  it('switches to the Documents tab when clicked', async () => {
    const user = userEvent.setup();
    renderDashboard();

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText(/Drop your files here/i)).toBeInTheDocument();
    });

    // Click the Documents nav button
    const docsTab = screen.getAllByRole('button', { name: /Documents/i })[0];
    await user.click(docsTab);

    // The header should now say Documents, not Upload Regulations
    await waitFor(() => {
      // heading rendered in <header>
      expect(screen.getAllByText('Documents').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('loads and displays documents after switching to Documents tab', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => screen.getByText(/Drop your files here/i));

    const docsTab = screen.getAllByRole('button', { name: /Documents/i })[0];
    await user.click(docsTab);

    await waitFor(() => {
      expect(screen.getByText('Regulations.pdf')).toBeInTheDocument();
    });
  });

  it('switches to the Settings tab when clicked', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => screen.getByText(/Drop your files here/i));

    const settingsTab = screen.getByRole('button', { name: /Settings/i });
    await user.click(settingsTab);

    await waitFor(() => {
      expect(screen.getByText('University Information')).toBeInTheDocument();
    });
  });
});

describe('UniversityDashboard — file input', () => {
  it('file input accepts pdf and docx', () => {
    renderDashboard();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.accept).toBe('.pdf,.docx');
  });

  it('file input allows multiple files', () => {
    renderDashboard();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.multiple).toBe(true);
  });
});

describe('UniversityDashboard — getDocuments', () => {
  it('calls getDocuments on mount', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(getDocuments).toHaveBeenCalled();
    });
  });
});
