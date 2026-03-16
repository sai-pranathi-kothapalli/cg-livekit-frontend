import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import JobsPage from '@/pages/JobsPage';
import * as AuthContext from '@/contexts/AuthContext';

// Mock the AuthContext wrapper or supply provider
vi.spyOn(AuthContext, 'useAuth');

const renderComponent = () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        isAuthenticated: true,
        user: { role: 'student' } as any,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
        isAdmin: false,
        isManager: false,
        isStudent: true
    });

    return render(
        <MemoryRouter>
            <JobsPage />
        </MemoryRouter>
    );
};

describe('JobsPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the jobs content correctly', () => {
        renderComponent();

        expect(screen.getByText('Interview Opportunity')).toBeInTheDocument();
        expect(screen.getByText('Interview Preparation Areas')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Apply for this position' })).toBeInTheDocument();
    });

    it('clicks the apply button', () => {
        renderComponent();

        const applyButton = screen.getByRole('button', { name: 'Apply for this position' });
        fireEvent.click(applyButton);
        // Using MemoryRouter handles the navigation internally. 
        // We verify button click executes without errors.
    });
});
