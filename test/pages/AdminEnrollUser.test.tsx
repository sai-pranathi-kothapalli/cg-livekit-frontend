import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminEnrollUser from '@/pages/AdminEnrollUser';
import * as api from '@/lib/api';
import * as AuthContext from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api', () => ({
    enrollUser: vi.fn(),
    bulkEnrollUsers: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
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

// Mock XLSX
vi.mock('xlsx', () => ({
    read: vi.fn().mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
    }),
    utils: {
        sheet_to_json: vi.fn().mockReturnValue([{ name: 'Test', email: 'test@example.com' }]),
    }
}));

const renderComponent = () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { role: 'admin' },
        isAdmin: true,
        isManager: false,
    } as any);

    return render(
        <MemoryRouter>
            <AdminEnrollUser />
        </MemoryRouter>
    );
};

describe('AdminEnrollUser Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders enrollment form', () => {
        const { container } = renderComponent();
        expect(screen.getByText('Enroll Single User')).toBeInTheDocument();
        expect(container.querySelector('input[type="text"]')).toBeInTheDocument();
        expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    });

    it('submits single user enrollment', async () => {
        vi.mocked(api.enrollUser).mockResolvedValueOnce({ success: true } as any);
        const { container } = renderComponent();

        const nameInput = container.querySelector('input[type="text"]')!;
        const emailInput = container.querySelector('input[type="email"]')!;

        fireEvent.change(nameInput, { target: { value: 'New User' } });
        fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

        fireEvent.click(screen.getByText('Enroll User', { selector: 'button' }));

        await waitFor(() => {
            expect(api.enrollUser).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New User',
                email: 'new@example.com',
            }));
            expect(screen.getByText(/✅ User enrolled successfully!/)).toBeInTheDocument();
        });
    });

    it('handles bulk upload selection', async () => {
        const { container } = renderComponent();

        fireEvent.click(screen.getByText('Bulk Enrollment'));

        const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = container.querySelector('input[type="file"]')!;

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText(/Selected: test.xlsx/)).toBeInTheDocument();
        });
    });
});
