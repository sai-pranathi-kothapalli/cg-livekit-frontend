import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useAgent, useSessionContext } from '@livekit/components-react';
import { toastAlert } from '@/components/livekit/alert-toast';

// Mock dependencies
vi.mock('@livekit/components-react', () => ({
    useAgent: vi.fn(),
    useSessionContext: vi.fn(),
}));

vi.mock('@/components/livekit/alert-toast', () => ({
    toastAlert: vi.fn(),
}));

describe('useAgentErrors Hook', () => {
    const mockEnd = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useSessionContext).mockReturnValue({
            isConnected: true,
            end: mockEnd,
        } as any);
    });

    it('displays toast and calls end() when agent fails with single reason', () => {
        vi.mocked(useAgent).mockReturnValue({
            state: 'failed',
            failureReasons: ['Connection timed out'],
        } as any);

        renderHook(() => useAgentErrors());

        expect(toastAlert).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Session ended',
        }));
        expect(mockEnd).toHaveBeenCalled();
    });

    it('displays toast and calls end() when agent fails with multiple reasons', () => {
        vi.mocked(useAgent).mockReturnValue({
            state: 'failed',
            failureReasons: ['Reason 1', 'Reason 2'],
        } as any);

        renderHook(() => useAgentErrors());

        expect(toastAlert).toHaveBeenCalled();
        expect(mockEnd).toHaveBeenCalled();
    });

    it('does nothing when agent is not in failed state', () => {
        vi.mocked(useAgent).mockReturnValue({
            state: 'connected',
            failureReasons: [],
        } as any);

        renderHook(() => useAgentErrors());

        expect(toastAlert).not.toHaveBeenCalled();
        expect(mockEnd).not.toHaveBeenCalled();
    });

    it('does nothing when not connected even if agent failed', () => {
        vi.mocked(useSessionContext).mockReturnValue({
            isConnected: false,
            end: mockEnd,
        } as any);
        vi.mocked(useAgent).mockReturnValue({
            state: 'failed',
            failureReasons: ['Failure'],
        } as any);

        renderHook(() => useAgentErrors());

        expect(toastAlert).not.toHaveBeenCalled();
        expect(mockEnd).not.toHaveBeenCalled();
    });
});
