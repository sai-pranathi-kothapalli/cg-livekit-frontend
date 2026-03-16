import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebugMode } from '@/hooks/useDebug';
import { useRoomContext } from '@livekit/components-react';
import { setLogLevel } from 'livekit-client';

// Mock dependencies
vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

vi.mock('livekit-client', () => ({
    setLogLevel: vi.fn(),
    LogLevel: {
        debug: 'debug',
        silent: 'silent',
        info: 'info',
    }
}));

describe('useDebugMode Hook', () => {
    const mockRoom = { name: 'test-room' };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useRoomContext).mockReturnValue(mockRoom as any);
        // @ts-expect-error global mock
        window.__lk_room = undefined;
    });

    afterEach(() => {
        // @ts-expect-error global mock
        window.__lk_room = undefined;
    });

    it('sets debug log level and assigns room context when enabled', () => {
        renderHook(() => useDebugMode({ enabled: true }));

        expect(setLogLevel).toHaveBeenCalledWith('debug');
        // @ts-expect-error global check
        expect(window.__lk_room).toBe(mockRoom);
    });

    it('sets silent log level and does not assign room when disabled', () => {
        renderHook(() => useDebugMode({ enabled: false }));

        expect(setLogLevel).toHaveBeenCalledWith('silent');
        // @ts-expect-error global check
        expect(window.__lk_room).toBeUndefined();
    });

    it('uses custom log level when provided', () => {
        renderHook(() => useDebugMode({ enabled: true, logLevel: 'info' as any }));

        expect(setLogLevel).toHaveBeenCalledWith('info');
    });

    it('cleans up on unmount', () => {
        const { unmount } = renderHook(() => useDebugMode({ enabled: true }));

        unmount();

        expect(setLogLevel).toHaveBeenLastCalledWith('silent');
        // @ts-expect-error global check
        expect(window.__lk_room).toBeUndefined();
    });
});
