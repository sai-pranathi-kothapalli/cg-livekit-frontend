import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminManageUsers from '@/pages/AdminManageUsers';
import * as api from '@/lib/api';
import * as AuthContext from '@/contexts/AuthContext';

// Mock dependencies
vi.mock('@/lib/api', () => ({
    getAllUsers: vi.fn(),
    getUser: vi.fn(),
    deleteUser: vi.fn(),
    updateUser: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/components/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

const mockUsers = [
    { id: '1', name: 'User One', email: 'one@example.com', role: 'student', status: 'enrolled', created_at: '2023-01-01T10:00:00Z' },
    { id: '2', name: 'User Two', email: 'two@example.com', role: 'manager', status: 'enrolled', created_at: '2023-01-02T10:00:00Z' },
];

const renderComponent = () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { role: 'admin' },
        isAuthenticated: true,
        isAdmin: true,
        isManager: false,
    } as any);

    return render(
        <MemoryRouter>
            <AdminManageUsers />
        </MemoryRouter>
    );
};

describe('AdminManageUsers Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getAllUsers).mockResolvedValue(mockUsers as any);
    });

    it('renders user list correctly', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('one@example.com')).toBeInTheDocument();
        });
    });

    it('handles user deletion', async () => {
        window.confirm = vi.fn().mockReturnValue(true);
        vi.mocked(api.deleteUser).mockResolvedValueOnce({ success: true } as any);
        // Re-mock loadUsers behavior
        vi.mocked(api.getAllUsers).mockResolvedValueOnce(mockUsers as any).mockResolvedValueOnce([mockUsers[1]] as any);

        renderComponent();

        await waitFor(() => expect(screen.getByText('User One')).toBeInTheDocument());

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        // Exact text from source: `confirm(`Are you sure you want to delete user "${userName}"?`)`
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete user "User One"?');

        await waitFor(() => {
            expect(api.deleteUser).toHaveBeenCalledWith('1');
        });
    });

    it('opens and closes edit modal', async () => {
        const { container } = renderComponent();

        await waitFor(() => expect(screen.getByText('User One')).toBeInTheDocument());

        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);

        // In edit mode it renders inputs
        await waitFor(() => {
            expect(container.querySelector('input[value="User One"]')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancel'));
        expect(container.querySelector('input[value="User One"]')).not.toBeInTheDocument();
    });

    it('saves user edits', async () => {
        vi.mocked(api.updateUser).mockResolvedValueOnce({ success: true } as any);
        const { container } = renderComponent();

        await waitFor(() => expect(screen.getByText('User One')).toBeInTheDocument());

        fireEvent.click(screen.getAllByText('Edit')[0]);

        const nameInput = container.querySelector('input[value="User One"]')!;
        fireEvent.change(nameInput, { target: { value: 'User One Updated' } });

        fireEvent.click(screen.getByText('Save', { selector: 'button' }));

        await waitFor(() => {
            expect(api.updateUser).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'User One Updated' }));
        });
    });

    it('handles API error when loading users', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(api.getAllUsers).mockRejectedValueOnce(new Error('Fetch failed'));
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Fetch failed')).toBeInTheDocument();
        });
        consoleSpy.mockRestore();
    });
});
