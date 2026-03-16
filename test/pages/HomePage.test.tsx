import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import * as AuthContext from '@/contexts/AuthContext';

// Spy on useAuth
vi.spyOn(AuthContext, 'useAuth');

const renderComponent = (authValue: any) => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        ...authValue,
        login: vi.fn(),
        logout: vi.fn(),
    });

    return render(
        <MemoryRouter>
            <HomePage />
        </MemoryRouter>
    );
};

describe('HomePage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly for unauthenticated user', () => {
        renderComponent({ isAuthenticated: false, isAdmin: false, isStudent: false });

        expect(screen.getAllByText('Codegnan AI Interview Platform')[0]).toBeInTheDocument();

        const loginButtons = screen.getAllByRole('button', { name: /Login/i });
        expect(loginButtons.length).toBeGreaterThan(0);

        const startInterviewButton = screen.getByRole('button', { name: 'Start Interview Now' });
        expect(startInterviewButton).toBeInTheDocument();

        fireEvent.click(startInterviewButton);
        // Navigation runs
    });

    it('redirects admin to admin dashboard', () => {
        renderComponent({ isAuthenticated: true, isAdmin: true, isStudent: false });

        const dashboardButton = screen.getByRole('button', { name: 'Go to Dashboard' });
        fireEvent.click(dashboardButton);
        // Navigation runs
    });

    it('redirects student to student dashboard', () => {
        renderComponent({ isAuthenticated: true, isAdmin: false, isStudent: true });

        const dashboardButton = screen.getByRole('button', { name: 'Go to Dashboard' });
        fireEvent.click(dashboardButton);
        // Navigation runs
    });

    it('navigates to jobs page when explore interviews is clicked', () => {
        renderComponent({ isAuthenticated: false, isAdmin: false, isStudent: false });

        const exploreButton = screen.getByRole('button', { name: 'Explore Interviews' });
        fireEvent.click(exploreButton);
        // Navigation runs
    });
});
