import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8080');
});

import * as client from '@/lib/api/client';
import {
    scheduleInterview,
    getInterviewAccessConfig,
    getBooking,
    uploadApplication
} from '@/lib/api/bookings';

vi.mock('@/lib/api/client', async () => {
    const actual = await vi.importActual('@/lib/api/client');
    return {
        ...actual,
        apiRequest: vi.fn(),
        getAuthHeaders: vi.fn(() => ({})),
    };
});

describe('Bookings API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn());
    });

    it('scheduleInterview makes a POST request', async () => {
        const data = { slot_id: '1', name: 'T' } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ success: true });
        await scheduleInterview(data);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/bookings/schedule-interview'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('getInterviewAccessConfig calls fetch directly (public)', async () => {
        const mockConfig = { status: 'ok' };
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockConfig
        } as Response);

        const result = await getInterviewAccessConfig();
        expect(result).toEqual(mockConfig);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/public/interview-config'));
    });

    describe('getBooking', () => {
        it('returns booking on success', async () => {
            const mockBooking = { id: 'b1' };
            vi.mocked(client.apiRequest).mockResolvedValueOnce(mockBooking);
            const result = await getBooking('t1');
            expect(result).toEqual(mockBooking);
        });

        it('returns null on 404', async () => {
            vi.mocked(client.apiRequest).mockRejectedValueOnce(new Error('404 Not Found'));
            const result = await getBooking('t1');
            expect(result).toBeNull();
        });

        it('throws on other errors', async () => {
            vi.mocked(client.apiRequest).mockRejectedValueOnce(new Error('500 Error'));
            await expect(getBooking('t1')).rejects.toThrow('500 Error');
        });
    });

    it('uploadApplication uses FormData', async () => {
        const file = new File([''], 'cv.pdf');
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ success: true });
        await uploadApplication(file);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/resume/upload-application'),
            expect.objectContaining({
                method: 'POST',
                body: expect.any(FormData)
            })
        );
    });
});
