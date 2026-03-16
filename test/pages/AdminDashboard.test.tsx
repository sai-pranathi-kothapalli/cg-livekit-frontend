import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '@/pages/AdminDashboard';
import * as AuthContext from '@/contexts/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/components/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

const renderComponent = () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { name: 'Admin User', role: 'admin' },
        isAuthenticated: true,
        isAdmin: true,
        isLoading: false,
    } as any);

    return render(
        <MemoryRouter>
            <AdminDashboard />
        </MemoryRouter>
    );
};

describe('AdminDashboard Component', () => {
    it('renders all dashboard cards', () => {
        renderComponent();

        expect(screen.getByRole('heading', { name: 'Edit Job Description' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Manage Managers' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Enroll User' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Manage Users' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Schedule Interview' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Gemini Usage' })).toBeInTheDocument();
    });

    it('navigates to the correct routes when buttons are clicked', () => {
        renderComponent();

        const actions = [
            { text: 'Edit JD', route: '/admin/jd-editor' },
            { text: 'Manage Managers', route: '/admin/manage-managers' },
            { text: 'Enroll User', route: '/admin/enroll-user' },
            { text: 'Manage Users', route: '/admin/manage-users' },
            { text: 'Schedule Interview', route: '/admin/schedule-interview' },
            { text: 'Check Gemini Usage', route: '/admin/gemini-usage' },
        ];

        actions.forEach(({ text, route }) => {
            fireEvent.click(screen.getByText(text, { selector: 'button' }));
            expect(mockNavigate).toHaveBeenCalledWith(route);
        });
    });
});
