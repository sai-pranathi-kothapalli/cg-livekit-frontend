import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminJDEditor from '@/pages/AdminJDEditor';
import * as api from '@/lib/api';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('@/lib/api', () => ({
    getJobDescription: vi.fn(),
    updateJobDescription: vi.fn(),
}));

vi.mock('@/components/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

const mockJD = {
    context: 'Original JD Context',
};

const renderComponent = () => {
    return render(
        <MemoryRouter>
            <AdminJDEditor />
        </MemoryRouter>
    );
};

describe('AdminJDEditor Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getJobDescription).mockResolvedValue(mockJD as any);
    });

    it('loads and displays JD context', async () => {
        renderComponent();

        expect(screen.getByText('Loading context...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Paste or type the full interviewer context/)).toHaveValue('Original JD Context');
        });
    });

    it('handles API error when loading', async () => {
        vi.mocked(api.getJobDescription).mockRejectedValueOnce(new Error('JD load failed'));
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('JD load failed')).toBeInTheDocument();
        });
    });

    it('saves JD updates', async () => {
        vi.mocked(api.updateJobDescription).mockResolvedValueOnce({ success: true } as any);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Paste or type the full interviewer context/)).toHaveValue('Original JD Context');
        });

        const textarea = screen.getByPlaceholderText(/Paste or type the full interviewer context/);
        fireEvent.change(textarea, { target: { value: 'Updated JD Context' } });

        fireEvent.click(screen.getByText('Save Context'));

        await waitFor(() => {
            expect(api.updateJobDescription).toHaveBeenCalledWith({ context: 'Updated JD Context' });
            expect(screen.getByText(/✅ Context saved successfully!/)).toBeInTheDocument();
        });
    });

    it('navigates back on cancel', async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText('Cancel')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
});
