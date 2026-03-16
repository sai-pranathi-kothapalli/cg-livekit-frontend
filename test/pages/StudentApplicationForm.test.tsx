import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StudentApplicationForm from '@/pages/StudentApplicationForm';
import * as api from '@/lib/api';
import * as AuthContext from '@/contexts/AuthContext';

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock api
vi.mock('@/lib/api', () => ({
    getApplicationForm: vi.fn(),
    uploadApplicationForm: vi.fn(),
}));

const mockFormData = {
    id: 'f1',
    status: 'pending',
    full_name: 'Test Student',
    created_at: '2026-03-01T10:00:00Z',
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
            <StudentApplicationForm />
        </MemoryRouter>
    );
};

describe('StudentApplicationForm Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty form when no previous submission exists', async () => {
        vi.mocked(api.getApplicationForm).mockResolvedValueOnce(null as any);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Upload Resume PDF')).toBeInTheDocument();
            expect(screen.queryByText('Resume Summary')).not.toBeInTheDocument();
        });
    });

    it('renders summary when form is already submitted', async () => {
        vi.mocked(api.getApplicationForm).mockResolvedValueOnce({
            ...mockFormData,
            status: 'submitted',
            submitted_at: '2026-03-10T12:00:00Z',
        } as any);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Resume Summary')).toBeInTheDocument();
            expect(screen.getByText('Your resume has been submitted and processed')).toBeInTheDocument();
            // Specific selector for the name in the summary section
            expect(screen.getByText('Test Student', { selector: 'span.font-medium' })).toBeInTheDocument();
        });
    });

    it('handles successful file upload', async () => {
        vi.mocked(api.getApplicationForm).mockResolvedValueOnce(null as any);
        vi.mocked(api.uploadApplicationForm).mockResolvedValueOnce({
            success: true,
            form: { ...mockFormData, status: 'submitted' },
        } as any);

        const { container } = renderComponent();
        await waitFor(() => screen.getByText('Upload Resume PDF'));

        const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(input, { target: { files: [file] } });
        expect(screen.getByText('resume.pdf')).toBeInTheDocument();

        const uploadBtn = screen.getByText('Upload & Submit');
        fireEvent.click(uploadBtn);

        await waitFor(() => {
            expect(api.uploadApplicationForm).toHaveBeenCalledWith(file);
            expect(screen.getByText(/Resume processed successfully!/i)).toBeInTheDocument();
            expect(screen.getByText('Go to My Interviews →')).toBeInTheDocument();
        });
    });

    it('handles upload failure', async () => {
        vi.mocked(api.getApplicationForm).mockResolvedValueOnce(null as any);
        vi.mocked(api.uploadApplicationForm).mockRejectedValueOnce(new Error('Upload failed'));

        const { container } = renderComponent();
        await waitFor(() => screen.getByText('Upload Resume PDF'));

        const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        fireEvent.click(screen.getByText('Upload & Submit'));

        await waitFor(() => {
            expect(screen.getByText('Upload failed')).toBeInTheDocument();
        });
    });
});
