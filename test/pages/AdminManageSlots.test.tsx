import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminManageSlots from '@/pages/AdminManageSlots';
import * as api from '@/lib/api';
import * as AuthContext from '@/contexts/AuthContext';

// Mock dependencies
vi.mock('@/lib/api', () => ({
    getSlots: vi.fn(),
    createSlot: vi.fn(),
    updateSlot: vi.fn(),
    deleteSlot: vi.fn(),
    createDaySlots: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/components/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

vi.mock('@/components/ManagerLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="manager-layout">{children}</div>,
}));

const mockSlots = [
    {
        id: 's1',
        slot_datetime: '2023-10-27T10:00:00.000Z',
        status: 'active',
        current_bookings: 5,
        max_capacity: 30,
        notes: 'Test slot 1'
    },
    {
        id: 's2',
        slot_datetime: '2023-10-27T11:00:00.000Z',
        status: 'full',
        current_bookings: 30,
        max_capacity: 30
    },
];

const renderComponent = (isManager = false) => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        isManager,
        user: { role: isManager ? 'manager' : 'admin' },
        isAdmin: !isManager,
    } as any);

    return render(
        <MemoryRouter>
            <AdminManageSlots />
        </MemoryRouter>
    );
};

describe('AdminManageSlots Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getSlots).mockResolvedValue(mockSlots as any);
    });

    it('renders slots grouped by date for admin', async () => {
        await act(async () => {
            renderComponent(false);
        });
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Interview Slots')).toBeInTheDocument();
            expect(screen.getByText(/Oct/i)).toBeInTheDocument();
            expect(screen.getByText(/27/)).toBeInTheDocument();
        });
    });

    it('renders ManagerLayout for manager user', async () => {
        await act(async () => {
            renderComponent(true);
        });
        expect(screen.getByTestId('manager-layout')).toBeInTheDocument();
    });

    it('filters slots by status', async () => {
        const { container } = renderComponent();
        await waitFor(() => screen.getByText('Interview Slots'));

        const filterSelect = container.querySelector('select')!;
        fireEvent.change(filterSelect, { target: { value: 'active' } });

        await waitFor(() => {
            expect(api.getSlots).toHaveBeenCalledWith('active', false);
        });
    });

    it('opens create slot modal and submits', async () => {
        vi.mocked(api.createSlot).mockResolvedValueOnce({ success: true } as any);
        const { container } = renderComponent();

        fireEvent.click(await screen.findByText('+ Create Slot'));

        expect(screen.getByText('Create New Slot')).toBeInTheDocument();

        // Fill form using container selectors due to missing label-id association
        const datetimeInput = container.querySelector('input[type="datetime-local"]')!;
        fireEvent.change(datetimeInput, { target: { value: '2023-11-27T10:00' } });

        await act(async () => {
            fireEvent.click(screen.getByText('Create Slot', { selector: 'button[type="submit"]' }));
        });

        await waitFor(() => {
            expect(api.createSlot).toHaveBeenCalled();
            expect(screen.queryByText('Create New Slot')).toBeNull();
        });
    });

    it('opens create day slots modal and submits', async () => {
        vi.mocked(api.createDaySlots).mockResolvedValueOnce({ created_count: 5, errors: [] } as any);
        const { container } = renderComponent();

        fireEvent.click(await screen.findByText(/Create Day Slots/i));

        expect(screen.getByText('Create Day Slots')).toBeInTheDocument();

        const dateInput = container.querySelector('input[type="date"]')!;
        fireEvent.change(dateInput, { target: { value: '2023-11-28' } });

        await act(async () => {
            fireEvent.click(screen.getByText('Create All Slots', { selector: 'button[type="submit"]' }));
        });

        await waitFor(() => {
            expect(api.createDaySlots).toHaveBeenCalled();
            expect(screen.queryByText('Create Day Slots')).toBeNull();
        });
    });

    it('handles delete slot', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        renderComponent();

        await waitFor(() => screen.getByText(/Oct/i));

        const deleteButtons = screen.getAllByTitle('Delete Slot');
        await act(async () => {
            fireEvent.click(deleteButtons[0]);
        });

        expect(confirmSpy).toHaveBeenCalled();
        expect(api.deleteSlot).toHaveBeenCalledWith('s1');

        confirmSpy.mockRestore();
    });
});
