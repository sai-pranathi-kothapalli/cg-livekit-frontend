import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ManagerDashboard from '@/pages/ManagerDashboard';
import * as api from '@/lib/api';
import * as AuthContext from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock api
vi.mock('@/lib/api', () => ({
    getSlots: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
    },
}));

const mockSlots = [
    {
        id: '1',
        status: 'active',
        current_bookings: 5,
        slot_datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    },
    {
        id: '2',
        status: 'completed',
        current_bookings: 3,
        slot_datetime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    },
];

const mockUser = {
    id: 'm1',
    name: 'Test Manager',
    email: 'manager@example.com',
    role: 'manager' as const,
};

const renderComponent = () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        isAdmin: false,
        isManager: true,
        isStudent: false,
        login: vi.fn(),
        logout: vi.fn(),
    });

    return render(
        <MemoryRouter>
            <ManagerDashboard />
        </MemoryRouter>
    );
};

describe('ManagerDashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders stats correctly when data is loaded', async () => {
        vi.mocked(api.getSlots).mockResolvedValueOnce(mockSlots as any);
        const { container } = renderComponent();

        // Wait for the dashboard content to appear
        await waitFor(() => {
            expect(screen.getByText('Manager Dashboard', { selector: 'h1' })).toBeInTheDocument();

            // Navigate to the cards. Active Slots is in h3, value is in div below it
            const cards = container.querySelectorAll('.rounded-xl.border');
            let activeSlots = '';
            let totalBookings = '';
            let upcomingSlots = '';

            cards.forEach(card => {
                const title = card.querySelector('h3')?.textContent;
                const value = card.querySelector('.text-2xl')?.textContent;
                if (title === 'Active Slots') activeSlots = value || '';
                if (title === 'Total Bookings') totalBookings = value || '';
                if (title === 'Upcoming Slots') upcomingSlots = value || '';
            });

            expect(activeSlots).toBe('1');
            expect(totalBookings).toBe('8');
            expect(upcomingSlots).toBe('1');
        });
    });

    it('handles API error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(api.getSlots).mockRejectedValueOnce(new Error('Fetch failed'));
        renderComponent();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load dashboard stats');
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    it('renders quick action links', async () => {
        vi.mocked(api.getSlots).mockResolvedValueOnce([]);
        const { container } = renderComponent();

        await waitFor(() => {
            const main = container.querySelector('main');
            expect(main?.textContent).toContain('Enroll Candidate');
            expect(main?.textContent).toContain('Manage Candidates');
            expect(main?.textContent).toContain('Manage Slots');
            expect(main?.textContent).toContain('Schedule Interview');
        });

        const main = container.querySelector('main');
        expect(main?.querySelector('a[href="/manager/enroll-user"]')).toBeInTheDocument();
        expect(main?.querySelector('a[href="/manager/manage-users"]')).toBeInTheDocument();
        expect(main?.querySelector('a[href="/manager/slots"]')).toBeInTheDocument();
        expect(main?.querySelector('a[href="/manager/schedule-interview"]')).toBeInTheDocument();
    });
});
