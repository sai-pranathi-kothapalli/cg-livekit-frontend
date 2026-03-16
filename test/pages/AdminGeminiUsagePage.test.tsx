import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminGeminiUsagePage from '@/pages/AdminGeminiUsagePage';
import * as api from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api', () => ({
    getGeminiUsageReport: vi.fn(),
}));

vi.mock('@/components/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

const mockBookings = [
    {
        token: 't1',
        name: 'Student One',
        email: 'one@example.com',
        scheduled_at: '2023-10-27T10:00:00Z',
        token_usage: {
            input_tokens: 100,
            output_tokens: 50,
            total_tokens: 150,
        }
    },
    {
        token: 't2',
        name: 'Student Two',
        email: 'two@example.com',
        scheduled_at: '2023-10-28T14:00:00Z',
        token_usage: {
            input_tokens: 200,
            output_tokens: 100,
            total_tokens: 300,
        }
    }
];

const renderComponent = () => {
    return render(
        <MemoryRouter>
            <AdminGeminiUsagePage />
        </MemoryRouter>
    );
};

describe('AdminGeminiUsagePage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getGeminiUsageReport).mockResolvedValue(mockBookings as any);
    });

    it('renders usage report data correctly', async () => {
        const { container } = renderComponent();

        expect(screen.getByText('Loading interview usage data...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Cumulative Gemini Usage')).toBeInTheDocument();
            expect(screen.getByText('Student One')).toBeInTheDocument();
            expect(screen.getByText('Student Two')).toBeInTheDocument();
        });

        const totalCards = container.querySelectorAll('.text-3xl.font-bold');
        expect(totalCards[0].textContent).toBe('300');
        expect(totalCards[1].textContent).toBe('150');
        expect(totalCards[2].textContent).toBe('450');
    });

    it('handles empty data', async () => {
        vi.mocked(api.getGeminiUsageReport).mockResolvedValueOnce([]);
        const { container } = renderComponent();

        await waitFor(() => {
            const totalCards = container.querySelectorAll('.text-3xl.font-bold');
            totalCards.forEach(card => expect(card.textContent).toBe('0'));
        });
    });

    it('handles API error', async () => {
        vi.mocked(api.getGeminiUsageReport).mockRejectedValueOnce(new Error('Usage fetch failed'));
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Usage fetch failed/)).toBeInTheDocument();
        });
    });
});
