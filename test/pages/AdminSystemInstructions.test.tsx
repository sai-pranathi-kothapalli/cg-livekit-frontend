import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminSystemInstructions from '@/pages/AdminSystemInstructions';
import * as api from '@/lib/api';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api', () => ({
    getSystemInstructions: vi.fn(),
    updateSystemInstructions: vi.fn(),
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

const renderComponent = () => {
    return render(
        <MemoryRouter>
            <AdminSystemInstructions />
        </MemoryRouter>
    );
};

describe('AdminSystemInstructions Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads and displays instructions', async () => {
        vi.mocked(api.getSystemInstructions).mockResolvedValueOnce({ instructions: 'Test Instructions' });
        renderComponent();

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter system instructions here/)).toHaveValue('Test Instructions');
        });
    });

    it('handles API error when loading', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(api.getSystemInstructions).mockRejectedValueOnce(new Error('Load failed'));
        renderComponent();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load system instructions');
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    it('updates instructions successfully', async () => {
        vi.mocked(api.getSystemInstructions).mockResolvedValueOnce({ instructions: 'Initial' });
        vi.mocked(api.updateSystemInstructions).mockResolvedValueOnce({ success: true } as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter system instructions here/)).toHaveValue('Initial');
        });

        const textarea = screen.getByPlaceholderText(/Enter system instructions here/);
        fireEvent.change(textarea, { target: { value: 'Updated Instructions' } });

        const saveButton = screen.getByText('Save Instructions');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(api.updateSystemInstructions).toHaveBeenCalledWith('Updated Instructions');
            expect(toast.success).toHaveBeenCalledWith('System instructions updated successfully');
        });
    });

    it('handles save error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(api.getSystemInstructions).mockResolvedValueOnce({ instructions: 'Initial' });
        vi.mocked(api.updateSystemInstructions).mockRejectedValueOnce(new Error('Save failed'));

        renderComponent();

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter system instructions here/)).toHaveValue('Initial');
        });

        fireEvent.click(screen.getByText('Save Instructions'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to update instructions');
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    it('resets instructions to original state', async () => {
        vi.mocked(api.getSystemInstructions).mockResolvedValueOnce({ instructions: 'Original' });
        vi.mocked(api.getSystemInstructions).mockResolvedValueOnce({ instructions: 'Original' }); // For the reset click

        renderComponent();

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter system instructions here/)).toHaveValue('Original');
        });

        fireEvent.change(screen.getByPlaceholderText(/Enter system instructions here/), { target: { value: 'Modified' } });
        expect(screen.getByPlaceholderText(/Enter system instructions here/)).toHaveValue('Modified');

        fireEvent.click(screen.getByText('Reset'));

        await waitFor(() => {
            expect(api.getSystemInstructions).toHaveBeenCalledTimes(2);
            expect(screen.getByPlaceholderText(/Enter system instructions here/)).toHaveValue('Original');
        });
    });
});
