import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StudentOverallAnalysis from '@/pages/StudentOverallAnalysis';
import * as api from '@/lib/api';
import * as AuthContext from '@/contexts/AuthContext';

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock api
vi.mock('@/lib/api', () => ({
    getStudentAnalytics: vi.fn(),
}));

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
        { date: '2026-03-01', score: 7.5, communication: 7.0, technical: 7.0, problem_solving: 8.0 },
        { date: '2026-03-10', score: 8.2, communication: 8.5, technical: 7.5, problem_solving: 9.0 },
    ],
    overall_analysis: 'Steady improvement observed across all categories.',
};

const mockUser = {
    id: '1',
    name: 'Test Student',
    email: 'student@example.com',
    role: 'student' as const,
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
            <StudentOverallAnalysis />
        </MemoryRouter>
    );
};

describe('StudentOverallAnalysis Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        vi.mocked(api.getStudentAnalytics).mockReturnValue(new Promise(() => { }));
        renderComponent();
        expect(screen.getByText(/Loading analytics.../i)).toBeInTheDocument();
    });

    it('renders analytics when data is available', async () => {
        vi.mocked(api.getStudentAnalytics).mockResolvedValueOnce(mockAnalytics);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('AI-Powered Analysis')).toBeInTheDocument();
            expect(screen.getByText('Performance Trend')).toBeInTheDocument();
            expect(screen.getByText('Steady improvement observed across all categories.')).toBeInTheDocument();
            // Specify score within the summary cards
            const scoreElements = screen.getAllByText('8.2/10');
            expect(scoreElements.length).toBeGreaterThan(0);
        });
    });

    it('renders "Not Enough Data" state for < 2 interviews', async () => {
        vi.mocked(api.getStudentAnalytics).mockResolvedValueOnce({
            ...mockAnalytics,
            total_interviews: 1,
        });
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Not Enough Data Yet')).toBeInTheDocument();
            expect(screen.getByText(/complete at least 2 interviews/i)).toBeInTheDocument();
        });
    });

    it('displays error if API fails', async () => {
        vi.mocked(api.getStudentAnalytics).mockRejectedValueOnce(new Error('Network error'));
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Failed to load analytics: Network error/i)).toBeInTheDocument();
        });
    });
});
