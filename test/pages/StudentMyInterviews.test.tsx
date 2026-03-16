import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StudentMyInterviews from '@/pages/StudentMyInterviews';
import * as api from '@/lib/api';
import * as AuthContext from '@/contexts/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock api
vi.mock('@/lib/api', () => ({
    getMyInterview: vi.fn(),
    getStudentAnalytics: vi.fn(),
}));

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const mockUser = {
    id: '1',
    name: 'Test Student',
    email: 'student@example.com',
    role: 'student' as const,
};

const mockInterviewData = {
    upcoming: [
        {
            booking: { id: 'b1', interview_url: 'http://test.com/join' },
            slot: { slot_datetime: '2026-06-20T10:00:00Z' }
        }
    ],
    completed: [
        {
            booking: { id: 'b2', token: 'token123', scheduled_at: '2026-05-15T14:00:00Z' },
            slot: { start_time: '2026-05-15T14:00:00Z' }
        }
    ],
    missed: []
};

const renderComponent = () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        isAdmin: false,
        isManager: false,
        isStudent: true,
        login: vi.fn(),
        logout: vi.fn(),
    });

    return render(
        <MemoryRouter>
            <StudentMyInterviews />
        </MemoryRouter>
    );
};

describe('StudentMyInterviews Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getStudentAnalytics).mockResolvedValue({} as any);
    });

    it('renders upcoming interviews by default', async () => {
        vi.mocked(api.getMyInterview).mockResolvedValueOnce(mockInterviewData);
        renderComponent();

        expect(screen.getByText(/Loading interview data.../i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Upcoming Interviews (1)')).toBeInTheDocument();
            expect(screen.getByText('Join Interview')).toBeInTheDocument();
            expect(screen.getByText('http://test.com/join')).toBeInTheDocument();
        });
    });

    it('switches between tabs', async () => {
        vi.mocked(api.getMyInterview).mockResolvedValueOnce(mockInterviewData);
        renderComponent();

        await waitFor(() => screen.getByText('Upcoming Interviews (1)'));

        fireEvent.click(screen.getByText(/Completed Interviews/i));
        expect(screen.getByText('Completed Interviews (1)')).toBeInTheDocument();
        expect(screen.getByText('View Evaluation')).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Missed Interviews/i));
        expect(screen.getByText('No missed interviews.')).toBeInTheDocument();
    });

    it('navigates to evaluation on button click', async () => {
        vi.mocked(api.getMyInterview).mockResolvedValueOnce(mockInterviewData);
        renderComponent();

        await waitFor(() => screen.getByText(/Completed Interviews/i));
        fireEvent.click(screen.getByText(/Completed Interviews/i));

        const viewEvalBtn = screen.getByRole('button', { name: /View Evaluation/i });
        fireEvent.click(viewEvalBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/evaluation/token123');
    });

    it('displays error if API fails', async () => {
        vi.mocked(api.getMyInterview).mockRejectedValueOnce(new Error('Failed to load'));
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Failed to load')).toBeInTheDocument();
        });
    });
});
