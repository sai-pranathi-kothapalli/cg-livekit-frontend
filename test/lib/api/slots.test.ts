import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000');
});

import * as client from '@/lib/api/client';
import { getSlots, createSlot, deleteSlot, getAvailableSlots, updateSlot, createDaySlots } from '@/lib/api/slots';

vi.mock('@/lib/api/client', async () => {
    const actual = await vi.importActual('@/lib/api/client');
    return {
        ...actual,
        apiRequest: vi.fn(),
        getAuthHeaders: vi.fn(() => ({})),
    };
});

describe('Slots API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getSlots calls apiRequest with correct URL', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce([]);
        await getSlots('available', true);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/slots/admin/slots?status=available&include_past=true'),
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('createSlot makes a POST request with ISO string', async () => {
        const slotData = { slot_datetime: '2023-01-01T10:00:00', other: 'data' } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ id: 1, ...slotData });

        await createSlot(slotData);

        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/slots/admin/slots'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    ...slotData,
                    slot_datetime: new Date(slotData.slot_datetime).toISOString()
                })
            })
        );
    });

    it('deleteSlot makes a DELETE request', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ success: true });
        await deleteSlot('123');
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/slots/admin/slots/123'),
            expect.objectContaining({ method: 'DELETE' })
        );
    });

    it('getAvailableSlots calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce([]);
        await getAvailableSlots();
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/slots/available')
        );
    });

    it('updateSlot makes a PUT request with ISO string', async () => {
        const slotId = '123';
        const updateData = { status: 'booked', slot_datetime: '2023-01-01T10:00:00' } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ id: slotId, ...updateData });

        await updateSlot(slotId, updateData);

        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining(`/api/slots/admin/slots/${slotId}`),
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({
                    status: 'booked',
                    slot_datetime: new Date('2023-01-01T10:00:00').toISOString()
                })
            })
        );
    });

    it('createDaySlots makes a POST request', async () => {
        const data = { date: '2023-01-01', start_time: '10:00', end_time: '18:00', slot_duration: 30 } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ count: 16 });

        await createDaySlots(data);

        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/slots/admin/slots/create-day'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(data)
            })
        );
    });
});
