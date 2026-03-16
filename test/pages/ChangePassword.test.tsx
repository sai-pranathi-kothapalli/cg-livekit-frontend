import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ChangePassword from '@/pages/ChangePassword';
import * as api from '@/lib/api';

// Mock the API client
vi.mock('@/lib/api', () => ({
    changePassword: vi.fn(),
    getUserData: vi.fn(),
}));

const renderComponent = () => {
    return render(
        <MemoryRouter>
            <ChangePassword />
        </MemoryRouter>
    );
};

describe('ChangePassword Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
    });

    it('renders the form correctly', () => {
        vi.mocked(api.getUserData).mockReturnValue({ email: 'test@example.com' } as any);
        renderComponent();
        expect(screen.getByText('Change Password')).toBeInTheDocument();
        expect(screen.getByLabelText(/Current.*Password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    });

    it('shows error if passwords do not match', () => {
        vi.mocked(api.getUserData).mockReturnValue({ email: 'test@example.com' } as any);
        renderComponent();

        fireEvent.change(screen.getByLabelText(/Current.*Password/i), { target: { value: 'oldpass' } });
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'differentpass' } });
        fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

        expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
        expect(api.changePassword).not.toHaveBeenCalled();
    });

    it('shows error if new password is too short', () => {
        vi.mocked(api.getUserData).mockReturnValue({ email: 'test@example.com' } as any);
        renderComponent();

        fireEvent.change(screen.getByLabelText(/Current.*Password/i), { target: { value: 'oldpass' } });
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'short' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'short' } });
        fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

        expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
        expect(api.changePassword).not.toHaveBeenCalled();
    });

    it('shows error if no user data found', () => {
        vi.mocked(api.getUserData).mockReturnValue(null);
        renderComponent();

        fireEvent.change(screen.getByLabelText(/Current.*Password/i), { target: { value: 'oldpass' } });
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'newpass123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

        expect(screen.getByText('User session not found. Please log in again.')).toBeInTheDocument();
    });

    it('displays error on API failure', async () => {
        vi.mocked(api.getUserData).mockReturnValue({ email: 'test@example.com' } as any);
        vi.mocked(api.changePassword).mockRejectedValueOnce(new Error('Invalid old password'));

        renderComponent();

        fireEvent.change(screen.getByLabelText(/Current.*Password/i), { target: { value: 'wrongpass' } });
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'newpass123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

        await waitFor(() => {
            expect(screen.getByText('Invalid old password')).toBeInTheDocument();
        });
    });

    it('successfully changes password and redirects', async () => {
        vi.mocked(api.getUserData).mockReturnValue({ email: 'test@example.com', must_change_password: true } as any);
        vi.mocked(api.changePassword).mockResolvedValueOnce({} as any);

        renderComponent();

        fireEvent.change(screen.getByLabelText(/Current.*Password/i), { target: { value: 'oldpass' } });
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'newpass123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

        await waitFor(() => {
            expect(api.changePassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                old_password: 'oldpass',
                new_password: 'newpass123'
            });
            expect(screen.getByText(/Password changed successfully/i)).toBeInTheDocument();
        });
    });
});
