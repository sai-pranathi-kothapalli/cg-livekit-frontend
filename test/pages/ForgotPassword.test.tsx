import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '@/pages/ForgotPassword';
import * as api from '@/lib/api';

// Mock the API client
vi.mock('@/lib/api', () => ({
    resetPassword: vi.fn(),
}));

const renderComponent = () => {
    return render(
        <MemoryRouter>
            <ForgotPassword />
        </MemoryRouter>
    );
};

describe('ForgotPassword Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
    });

    it('renders the form correctly', () => {
        renderComponent();
        expect(screen.getAllByText('Reset Password')[0]).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    });

    it('shows error if passwords do not match', () => {
        renderComponent();

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'differentpass' } });
        fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        expect(api.resetPassword).not.toHaveBeenCalled();
    });

    it('shows error if new password is too short', () => {
        renderComponent();

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'short' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'short' } });
        fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

        expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
        expect(api.resetPassword).not.toHaveBeenCalled();
    });

    it('displays error on API failure', async () => {
        vi.mocked(api.resetPassword).mockRejectedValueOnce(new Error('User not found'));

        renderComponent();

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'newpass123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

        await waitFor(() => {
            expect(screen.getByText('User not found')).toBeInTheDocument();
        });
    });

    it('successfully resets password and shows success message', async () => {
        vi.mocked(api.resetPassword).mockResolvedValueOnce({} as any);

        renderComponent();

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'newpass123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

        await waitFor(() => {
            expect(api.resetPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                new_password: 'newpass123'
            });
            expect(screen.getByText(/Password reset successfully/i)).toBeInTheDocument();
        });
    });
});
