import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminManageManagers from '@/pages/AdminManageManagers';
import * as api from '@/lib/api';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api', () => ({
    getManagers: vi.fn(),
    enrollManager: vi.fn(),
    deleteManager: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@/components/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

vi.mock('@/components/livekit/button', () => ({
    Button: ({ children, onClick, disabled, type }: any) => (
        <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
    ),
}));

const mockManagers = [
    { id: 'm1', name: 'Manager One', email: 'm1@example.com', created_at: '2023-10-27T10:00:00Z' },
    { id: 'm2', name: 'Manager Two', email: 'm2@example.com', created_at: '2023-10-28T10:00:00Z' },
];

const renderComponent = () => {
    return render(
        <MemoryRouter>
            <AdminManageManagers />
        </MemoryRouter>
    );
};

describe('AdminManageManagers Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getManagers).mockResolvedValue(mockManagers as any);
    });

    it('renders manager list', async () => {
        const { container } = renderComponent();

        // Wait for spinner to disappear and content to appear
        await waitFor(() => {
            expect(container.querySelector('.animate-spin')).toBeNull();
            expect(screen.getByText('Manager One')).toBeInTheDocument();
            expect(screen.getByText('Manager Two')).toBeInTheDocument();
            expect(screen.getByText('m1@example.com')).toBeInTheDocument();
        });
    });

    it('opens and closes add manager modal', async () => {
        renderComponent();

        const addButton = await screen.findByText('+ Add Manager');
        fireEvent.click(addButton);

        expect(screen.getByText('Add New Manager')).toBeInTheDocument();

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(screen.queryByText('Add New Manager')).toBeNull();
    });

    it('submits add manager form successfully', async () => {
        vi.mocked(api.enrollManager).mockResolvedValueOnce({ temp_password: 'temp123' } as any);
        renderComponent();

        fireEvent.click(await screen.findByText('+ Add Manager'));

        fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'New Manager' } });
        fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'new@example.com' } });

        fireEvent.click(screen.getByText('Add Manager', { selector: 'button[type="submit"]' }));

        await waitFor(() => {
            expect(api.enrollManager).toHaveBeenCalledWith('New Manager', 'new@example.com');
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('Manager enrolled! Temporary password: temp123'),
                expect.any(Object)
            );
        });
    });

    it('handles delete manager with confirmation', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        renderComponent();

        await waitFor(() => screen.getByText('Manager One'));

        const deleteButtons = screen.getAllByText('Remove');
        fireEvent.click(deleteButtons[0]);

        expect(confirmSpy).toHaveBeenCalled();
        expect(api.deleteManager).toHaveBeenCalledWith('m1');

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Manager removed successfully');
        });
        confirmSpy.mockRestore();
    });

    it('handles API error on load', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(api.getManagers).mockRejectedValueOnce(new Error('Load failed'));
        renderComponent();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load managers');
        });
        consoleSpy.mockRestore();
    });
});
