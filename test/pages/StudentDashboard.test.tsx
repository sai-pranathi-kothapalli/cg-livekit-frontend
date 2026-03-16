import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StudentDashboard from '@/pages/StudentDashboard';
import * as AuthContext from '@/contexts/AuthContext';
import * as api from '@/lib/api';

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

const mockAnalytics = {
    total_interviews: 2,
    average_scores: {
        communication: 8.5,
        technical: 7.2,
        problem_solving: 9.0,
        overall: 8.2,
    },
    recent_strengths: ['Communication', 'Quick Thinking'],
    recent_improvements: ['System Design'],
    history: [
        { date: '2026-03-01', score: 7.5 },
        { date: '2026-03-10', score: 8.2 },
    ],
    overall_analysis: 'Steady improvement observed.',
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
            <StudentDashboard />
        </MemoryRouter>
    );
};

describe('StudentDashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially and then analytics', async () => {
        vi.mocked(api.getStudentAnalytics).mockResolvedValueOnce(mockAnalytics);
        renderComponent();

        expect(screen.getByText(/Welcome, Test Student!/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Performance Overview')).toBeInTheDocument();
            expect(screen.getByText('Feedback Summary')).toBeInTheDocument();
            // Specify that we want the one in the communication score row
            expect(screen.getByText('8.5/10')).toBeInTheDocument();
        });
    });

    it('renders empty state when no interviews completed', async () => {
        vi.mocked(api.getStudentAnalytics).mockResolvedValueOnce({
            ...mockAnalytics,
            total_interviews: 0,
        });
        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText('Performance Overview')).not.toBeInTheDocument();
            expect(screen.getByText('Manage your resume and track your progress here.')).toBeInTheDocument();
        });
    });

    it('navigates to different pages on card clicks', async () => {
        vi.mocked(api.getStudentAnalytics).mockResolvedValueOnce(mockAnalytics);
        renderComponent();

        await act(async () => {
            fireEvent.click(screen.getByText('Available Jobs'));
        });
        expect(mockNavigate).toHaveBeenCalledWith('/student/jobs');

        await act(async () => {
            fireEvent.click(screen.getByText('Apply for Job'));
        });
        expect(mockNavigate).toHaveBeenCalledWith('/student/apply');

        // Use a more specific selector for the Resume card heading
        await act(async () => {
            fireEvent.click(screen.getByRole('heading', { name: 'Resume' }));
        });
        expect(mockNavigate).toHaveBeenCalledWith('/student/application-form');
    });

    it('handles API error gracefully', async () => {
        vi.mocked(api.getStudentAnalytics).mockRejectedValueOnce(new Error('Failed to fetch'));
        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText('Performance Overview')).not.toBeInTheDocument();
            expect(screen.getByText(/Welcome, Test Student!/i)).toBeInTheDocument();
        });
    });
});
