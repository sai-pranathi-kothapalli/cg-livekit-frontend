import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ApplyPage from '@/pages/ApplyPage';
import * as api from '@/lib/api';
import * as AuthContext from '@/contexts/AuthContext';

// Mock the API requests
vi.mock('@/lib/api', () => ({
    uploadApplication: vi.fn(),
    scheduleInterview: vi.fn(),
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
            <ApplyPage />
        </MemoryRouter>
    );
};

describe('ApplyPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the apply form correctly', () => {
        renderComponent();
        expect(screen.getByText('Schedule your interview')).toBeInTheDocument();
        expect(screen.getByLabelText(/Full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Phone number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Upload Application/i)).toBeInTheDocument();
    });

    it('validates name strictly allowing only letters and spaces', () => {
        renderComponent();
        const nameInput = screen.getByLabelText(/Full name/i);

        fireEvent.change(nameInput, { target: { value: 'John123!' } });
        expect(screen.getByText('Name can only contain letters and spaces')).toBeInTheDocument();
    });

    it('validates phone number strictly to 10 digits', () => {
        renderComponent();
        const phoneInput = screen.getByLabelText(/Phone number/i);

        fireEvent.change(phoneInput, { target: { value: '123' } });
        expect(screen.getByText('Phone number must be exactly 10 digits')).toBeInTheDocument();

        fireEvent.change(phoneInput, { target: { value: '1234567890' } });
        expect(screen.queryByText('Phone number must be exactly 10 digits')).not.toBeInTheDocument();
    });

    it('validates file upload sizing and type', () => {
        renderComponent();
        const fileInput = screen.getByLabelText(/Upload Application/i);

        // Large file
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
        fireEvent.change(fileInput, { target: { files: [largeFile] } });
        expect(screen.getByText('Application file must be less than 5MB')).toBeInTheDocument();

        // Invalid format
        const badFile = new File(['text content'], 'file.txt', { type: 'text/plain' });
        fireEvent.change(fileInput, { target: { files: [badFile] } });
        expect(screen.getByText('Please upload a PDF or DOC/DOCX file')).toBeInTheDocument();

        // Good file
        const goodFile = new File(['dummy'], 'resume.pdf', { type: 'application/pdf' });
        fireEvent.change(fileInput, { target: { files: [goodFile] } });
        expect(screen.getByText(/✓ Selected: resume.pdf/i)).toBeInTheDocument();
    });

    it('submits successfully when form is valid', async () => {
        vi.mocked(api.uploadApplication).mockResolvedValueOnce({
            applicationUrl: 's3://resumes/123.pdf',
            applicationText: 'My resume text',
            success: true
        });

        vi.mocked(api.scheduleInterview).mockResolvedValueOnce({
            interviewUrl: 'http://localhost/interview/abcd',
            success: true
        } as any);

        const { debug } = renderComponent();

        fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Alice Smith' } });
        fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'alice@example.com' } });
        fireEvent.change(screen.getByLabelText(/Phone number/i), { target: { value: '1234567890' } });

        const fileInput = screen.getByLabelText(/Upload Application/i);
        const goodFile = new File(['dummy'], 'resume.pdf', { type: 'application/pdf' });
        fireEvent.change(fileInput, { target: { files: [goodFile] } });

        const dateInput = screen.getByLabelText(/Date/, { selector: 'input[type="date"]' });
        fireEvent.change(dateInput, { target: { value: '2030-01-01' } });

        fireEvent.change(screen.getByLabelText(/Hour/i), { target: { value: '11' } });
        fireEvent.change(screen.getByLabelText(/Minute/i), { target: { value: '30' } });
        fireEvent.change(screen.getByLabelText(/AM\/PM/i), { target: { value: 'AM' } });

        const form = screen.getByTestId('apply-form');
        fireEvent.submit(form);

        await waitFor(() => {
            try {
                expect(api.uploadApplication).toHaveBeenCalled();
                expect(api.scheduleInterview).toHaveBeenCalled();
                expect(screen.getByText(/Interview scheduled successfully!/i)).toBeInTheDocument();
            } catch (e) {
                // debug(); // Only call this if you can see stdout
                throw e;
            }
        }, { timeout: 4000 });
    }, 10000); // Higher test timeout

    it('displays error if submit fails', async () => {
        vi.mocked(api.uploadApplication).mockRejectedValueOnce(new Error('Network error'));

        renderComponent();

        fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Alice Smith' } });
        fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'alice@example.com' } });
        fireEvent.change(screen.getByLabelText(/Phone number/i), { target: { value: '1234567890' } });

        const fileInput = screen.getByLabelText(/Upload Application/i);
        const goodFile = new File(['dummy'], 'resume.pdf', { type: 'application/pdf' });
        fireEvent.change(fileInput, { target: { files: [goodFile] } });

        const dateInput = screen.getByLabelText(/Date/, { selector: 'input[type="date"]' });
        fireEvent.change(dateInput, { target: { value: '2030-01-01' } });

        const form = screen.getByTestId('apply-form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByTestId('error-message')).toHaveTextContent(/Network error/i);
        }, { timeout: 4000 });
    }, 10000);
});
