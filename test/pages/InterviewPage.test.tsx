import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InterviewPage from '@/pages/InterviewPage';
import * as api from '@/lib/api/bookings';
import * as utils from '@/lib/utils';
import * as AuthContext from '@/contexts/AuthContext';
import { APP_CONFIG_DEFAULTS } from '@/app-config';

// Mock dependencies
vi.mock('@/lib/api/bookings', () => ({
    getBooking: vi.fn(),
    getInterviewAccessConfig: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
    getAppConfig: vi.fn(),
    cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock components
vi.mock('@/components/app/app', () => ({
    App: ({ interviewToken, interviewDuration }: any) => (
        <div data-testid="interview-app">
            App - {interviewToken} - {interviewDuration}min
        </div>
    ),
}));

vi.mock('@/components/pre-interview/PreInterviewChecks', () => ({
    PreInterviewChecks: ({ onAllChecksPassed, userName }: any) => (
        <div data-testid="pre-interview-checks">
            Checks - {userName}
            <button onClick={onAllChecksPassed}>Pass Checks</button>
        </div>
    ),
}));

const mockBooking = {
    id: 'b1',
    token: 'test-token',
    scheduled_at: new Date(Date.now()).toISOString(),
    application_form_submitted: true,
    slot: {
        duration_minutes: 45,
    }
};

const renderComponent = (token = 'test-token', authState = {}) => {
    const defaultAuth = {
        user: { name: 'Test Student', role: 'student' },
        isAuthenticated: true,
        isStudent: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
    };

    vi.mocked(AuthContext.useAuth).mockReturnValue({ ...defaultAuth, ...authState } as any);

    return render(
        <MemoryRouter initialEntries={[`/interview/${token}`]}>
            <Routes>
                <Route path="/interview/:token" element={<InterviewPage />} />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('InterviewPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getInterviewAccessConfig).mockResolvedValue({ require_login_for_interview: true });
        vi.mocked(utils.getAppConfig).mockResolvedValue(APP_CONFIG_DEFAULTS);
    });

    it('renders loading state initially', async () => {
        vi.mocked(api.getBooking).mockReturnValue(new Promise(() => { })); // Never resolves
        renderComponent();
        expect(screen.getByText('Loading interview...')).toBeInTheDocument();
    });

    it('redirects to login if authentication is required but not provided', async () => {
        vi.mocked(api.getInterviewAccessConfig).mockResolvedValue({ require_login_for_interview: true });
        renderComponent('test-token', { isAuthenticated: false, isStudent: false });

        await waitFor(() => {
            expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        });

        // Wait for redirect timeout
        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('shows error if application form is not submitted', async () => {
        vi.mocked(api.getBooking).mockResolvedValueOnce({ ...mockBooking, application_form_submitted: false });
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Application Form Required')).toBeInTheDocument();
        });
    });

    it('shows error if interview has not started yet', async () => {
        const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour later
        vi.mocked(api.getBooking).mockResolvedValueOnce({ ...mockBooking, scheduled_at: futureDate });
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Your interview has not started yet')).toBeInTheDocument();
        });
    });

    it('shows error if interview has expired', async () => {
        const pastDate = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago
        // Duration 45 min, so it ended 1h 15m ago
        vi.mocked(api.getBooking).mockResolvedValueOnce({ ...mockBooking, scheduled_at: pastDate });
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Interview window has expired')).toBeInTheDocument();
        });
    });

    it('renders PreInterviewChecks when all conditions are met', async () => {
        vi.mocked(api.getBooking).mockResolvedValueOnce(mockBooking);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByTestId('pre-interview-checks')).toBeInTheDocument();
            expect(screen.getByText(/Checks - Test Student/)).toBeInTheDocument();
        });
    });

    it('renders App component after pre-interview checks pass', async () => {
        vi.mocked(api.getBooking).mockResolvedValueOnce(mockBooking);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByTestId('pre-interview-checks')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Pass Checks'));

        expect(screen.getByTestId('interview-app')).toBeInTheDocument();
        expect(screen.getByText(/App - test-token - 45min/)).toBeInTheDocument();
    });

    it('handles "Interview not found" error', async () => {
        vi.mocked(api.getBooking).mockResolvedValueOnce(null);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Interview not found')).toBeInTheDocument();
        });
    });
});
