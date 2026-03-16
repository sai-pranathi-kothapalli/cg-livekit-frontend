import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminScheduleInterview from '@/pages/AdminScheduleInterview';
import * as api from '@/lib/api';
import * as AuthContext from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api', () => ({
    getAllUsers: vi.fn(),
    getSlots: vi.fn(),
    scheduleInterviewForUser: vi.fn(),
    bulkScheduleInterviews: vi.fn(),
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
        sheet_to_json: vi.fn().mockReturnValue([
            { email: 'student1@example.com', date: '2023-10-27', time: '10:00' }
        ])
    }
}));

const mockUsers = [
    { id: 'u1', name: 'Student One', email: 's1@example.com', role: 'student' },
];

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);
const futureISO = futureDate.toISOString();
const dateValue = futureISO.split('T')[0]; // e.g. "2026-03-20"

const mockSlots = [
    {
        id: 's1',
        slot_datetime: futureISO,
        status: 'active',
        current_bookings: 0,
        capacity: 1
    }
];

const renderComponent = () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { role: 'admin' },
        isAdmin: true,
        isManager: false,
    } as any);

    return render(
        <MemoryRouter>
            <AdminScheduleInterview />
        </MemoryRouter>
    );
};

describe('AdminScheduleInterview Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getAllUsers).mockResolvedValue(mockUsers as any);
        vi.mocked(api.getSlots).mockResolvedValue(mockSlots as any);
    });

    it('renders scheduling form', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Schedule Single Interview')).toBeInTheDocument();
            expect(screen.getByText(/Select User/)).toBeInTheDocument();
        });
    });

    it('submits single interview schedule', async () => {
        vi.mocked(api.scheduleInterviewForUser).mockResolvedValueOnce({ success: true } as any);
        const { container } = renderComponent();

        await waitFor(() => expect(screen.getByText(/Student One/)).toBeInTheDocument());

        const selectContainers = container.querySelectorAll('div > select');
        // 0: User Select, 1: Date Select
        fireEvent.change(selectContainers[0], { target: { value: 'u1' } });
        fireEvent.change(selectContainers[1], { target: { value: dateValue } });

        // Wait for time slot select to appear (it becomes the 3rd select)
        await waitFor(() => {
            const selects = container.querySelectorAll('select');
            if (selects.length >= 3) {
                fireEvent.change(selects[2], { target: { value: 's1' } });
            }
        });

        const scheduleButton = screen.getByText('Schedule Interview', { selector: 'button' });
        fireEvent.click(scheduleButton);

        await waitFor(() => {
            expect(api.scheduleInterviewForUser).toHaveBeenCalledWith({
                user_id: 'u1',
                slot_id: 's1',
                prompt: undefined
            });
            expect(screen.getByText(/Interview scheduled successfully!/i)).toBeInTheDocument();
        });
    });

    it('handles bulk upload selection', async () => {
        const { container } = renderComponent();

        fireEvent.click(screen.getByText('Bulk Schedule'));

        const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = container.querySelector('input[type="file"]')!;

        fireEvent.change(input, { target: { files: [file] } });
    });
});
