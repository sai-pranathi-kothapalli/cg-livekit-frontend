import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from '@/lib/api/client';
import { getEvaluation } from '@/lib/api/interviews';

vi.mock('@/lib/api/client', async () => {
    const actual = await vi.importActual('@/lib/api/client');
    return {
        ...actual,
        apiRequest: vi.fn(),
        getAuthHeaders: vi.fn(() => ({})),
    };
});

describe('Interviews API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getEvaluation calls apiRequest with token in URL', async () => {
        const mockResponse = { id: 'test-id', scores: {} };
        vi.mocked(client.apiRequest).mockResolvedValueOnce(mockResponse);

        const result = await getEvaluation('token-abc');

        expect(result).toEqual(mockResponse);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/interviews/evaluation/token-abc'),
            expect.objectContaining({
                headers: expect.any(Object)
            })
        );
        expect(client.getAuthHeaders).toHaveBeenCalled();
    });
});
