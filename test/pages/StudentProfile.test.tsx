import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StudentProfile from '@/pages/StudentProfile';
import * as AuthContext from '@/contexts/AuthContext';

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const mockUser = {
    id: '1',
    name: 'Test Student',
    email: 'student@example.com',
    phone: '1234567890',
    role: 'student' as const,
};

const renderComponent = (user = mockUser) => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user,
        isAuthenticated: true,
        isLoading: false,
        isAdmin: false,
        isManager: false,
        isStudent: true,
        login: vi.fn(),
        logout: vi.fn(),
    });

    return render(
        <MemoryRouter>
            <StudentProfile />
        </MemoryRouter>
    );
};

describe('StudentProfile Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders profile information correctly', () => {
        const { container } = renderComponent();
        expect(screen.getByText('My Profile')).toBeInTheDocument();

        // Use a more specific selector for the profile content area
        const mainContent = container.querySelector('main');
        expect(mainContent).toBeTruthy();

        if (mainContent) {
            expect(vi.mocked(mainContent.querySelector('h2'))?.textContent).toBe('Test Student');
            expect(mainContent.innerHTML).toContain('student@example.com');
            expect(mainContent.innerHTML).toContain('1234567890');
        }
    });

    it('toggles edit mode', () => {
        renderComponent();
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);

        // Should see form fields
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
        // There are two Cancel buttons, one in header, one in footer. Use getAll and check length.
        const cancelButtons = screen.getAllByText('Cancel');
        expect(cancelButtons.length).toBeGreaterThan(0);

        expect(screen.getByDisplayValue('Test Student')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();

        // Toggle back
        fireEvent.click(cancelButtons[0]);
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    it('handles missing user data gracefully', () => {
        const incompleteUser = { ...mockUser, name: '', phone: '' };
        const { container } = renderComponent(incompleteUser);

        const mainContent = container.querySelector('main');
        // If name is missing, it defaults to 'Student' (or whatever the component logic is)
        // Let's check what the component actually shows
        expect(mainContent?.innerHTML).toContain('student@example.com');
    });
});
