import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InterviewEvaluationPage from '@/pages/InterviewEvaluationPage';
import * as api from '@/lib/api';
import * as AuthContext from '@/contexts/AuthContext';

// Mock dependencies
vi.mock('@/lib/api', () => ({
    getEvaluation: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const mockEvaluation = {
    id: 'e1',
    booking: {
        id: 'b1',
        scheduled_at: '2023-10-27T10:00:00Z',
    },
    overall_score: 8.5,
    communication_quality: 9,
    technical_knowledge: 8,
    problem_solving: 8.5,
    coding_score: 7,
    overall_feedback: '# Summary\nGreat performance!\n- Good clarity\n- Strong technicals\n\n# Hire Recommendation\nStrong Hire',
    strengths: ['Communication', 'Quick thinking'],
    areas_for_improvement: ['Naming variables'],
    transcript: [
        { role: 'assistant', content: 'What is React?', timestamp: '2023-10-27T10:01:00Z' },
        { role: 'user', content: 'It is a library.', timestamp: '2023-10-27T10:01:10Z' },
    ],
    interview_metrics: {
        duration_minutes: 25,
    }
};

const renderComponent = (token = 'test-token', userRole = 'student') => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { name: 'Test User', role: userRole },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
    } as any);

    return render(
        <MemoryRouter initialEntries={[`/evaluation/${token}`]}>
            <Routes>
                <Route path="/evaluation/:token" element={<InterviewEvaluationPage />} />
                <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
                <Route path="/student/my-interviews" element={<div>My Interviews</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('InterviewEvaluationPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders evaluation data correctly', async () => {
        vi.mocked(api.getEvaluation).mockResolvedValueOnce(mockEvaluation as any);
        renderComponent();

        expect(screen.getByText('Loading evaluation…')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Interview Evaluation')).toBeInTheDocument();
            // Since 8.5 appears twice (overall and problem solving), check all
            expect(screen.getAllByText('8.5').length).toBeGreaterThan(0);
            expect(screen.getByText('Communication Quality')).toBeInTheDocument();
            expect(screen.getByText('Technical Knowledge')).toBeInTheDocument();
            expect(screen.getByText('Problem Solving')).toBeInTheDocument();
            expect(screen.getByText('Coding Performance')).toBeInTheDocument();
        });

        expect(screen.getByText('9.0')).toBeInTheDocument();
        expect(screen.getByText('8.0')).toBeInTheDocument();
        expect(screen.getByText('7.0')).toBeInTheDocument();
    });

    it('switches between Overview and Transcript tabs', async () => {
        vi.mocked(api.getEvaluation).mockResolvedValueOnce(mockEvaluation as any);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('✨ Strengths')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Full Transcript'));

        expect(screen.getByText('INTERVIEWER')).toBeInTheDocument();
        expect(screen.getByText('What is React?')).toBeInTheDocument();
        expect(screen.getByText('CANDIDATE')).toBeInTheDocument();
        expect(screen.getByText('It is a library.')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Overview'));
        expect(screen.getByText('✨ Strengths')).toBeInTheDocument();
    });

    it('handles AI processing state', async () => {
        vi.mocked(api.getEvaluation).mockResolvedValueOnce({
            ...mockEvaluation,
            overall_feedback: 'AI analysis in progress...',
        } as any);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('AI Analysis in Progress')).toBeInTheDocument();
        });
    });

    it('navigates back to correct dashboard based on role', async () => {
        vi.mocked(api.getEvaluation).mockResolvedValue(mockEvaluation as any);

        const { unmount } = renderComponent('token-1', 'admin');
        await waitFor(() => expect(screen.getByText('← Back')).toBeInTheDocument());
        fireEvent.click(screen.getByText('← Back'));
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

        unmount();

        renderComponent('token-2', 'student');
        await waitFor(() => expect(screen.getByText('← Back')).toBeInTheDocument());
        fireEvent.click(screen.getByText('← Back'));
        expect(screen.getByText('My Interviews')).toBeInTheDocument();
    });

    it('displays error message when API fails', async () => {
        vi.mocked(api.getEvaluation).mockRejectedValueOnce(new Error('Failed to fetch evaluation data'));
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch evaluation data')).toBeInTheDocument();
        });
    });
});
