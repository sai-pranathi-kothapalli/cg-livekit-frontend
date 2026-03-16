import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAudioAnalyser } from '@/hooks/useAudioAnalyser';

// Mock Web Audio API
class MockAudioContext {
    state = 'suspended';
    onstatechange = null;
    createMediaStreamSource() {
        return {
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createAnalyser() {
        return {
            fftSize: 2048,
            frequencyBinCount: 1024,
            smoothingTimeConstant: 0.8,
            minDecibels: -100,
            maxDecibels: -30,
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    resume() {
        return Promise.resolve();
    }
    close() {
        return Promise.resolve();
    }
}

class MockMediaStream {
    constructor(tracks: any[]) { }
}

describe('useAudioAnalyser Hook', () => {
    beforeEach(() => {
        vi.stubGlobal('AudioContext', MockAudioContext);
        vi.stubGlobal('MediaStream', MockMediaStream);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const mockTrack = {
        kind: 'audio',
        mediaStreamTrack: { readyState: 'live', enabled: true },
        isMuted: false,
    };

    const mockTrackRef = {
        publication: {
            track: mockTrack,
            trackSid: 't1',
        },
        participant: {
            identity: 'p1',
        },
    };

    it('initializes analyser when track is provided', () => {
        const { result } = renderHook(() => useAudioAnalyser(mockTrackRef as any));

        expect(result.current.analyserNode.current).not.toBeNull();
        expect(result.current.dataArray.current).toBeInstanceOf(Uint8Array);
    });

    it('handles missing track gracefully', () => {
        const { result } = renderHook(() => useAudioAnalyser(undefined));

        expect(result.current.analyserNode.current).toBeNull();
        expect(result.current.dataArray.current).toBeNull();
    });

    it('resumes AudioContext on user interaction', () => {
        renderHook(() => useAudioAnalyser(mockTrackRef as any));

        const resumeSpy = vi.spyOn(AudioContext.prototype, 'resume');

        // Simulate click
        window.dispatchEvent(new MouseEvent('click'));
        expect(resumeSpy).toHaveBeenCalled();

        // Simulate touch
        window.dispatchEvent(new TouchEvent('touchstart'));
        expect(resumeSpy).toHaveBeenCalledTimes(2);
    });

    it('cleans up on unmount', () => {
        const { unmount, result } = renderHook(() => useAudioAnalyser(mockTrackRef as any));

        const closeSpy = vi.spyOn(AudioContext.prototype, 'close');

        unmount();

        expect(closeSpy).toHaveBeenCalled();
        expect(result.current.analyserNode.current).toBeNull();
    });

    it('handles track changes', () => {
        const { rerender, result } = renderHook(
            ({ tr }) => useAudioAnalyser(tr),
            { initialProps: { tr: mockTrackRef as any } }
        );

        const initialAnalyser = result.current.analyserNode.current;
        expect(initialAnalyser).not.toBeNull();

        // Change track SID
        const newTrackRef = {
            ...mockTrackRef,
            publication: { ...mockTrackRef.publication, trackSid: 't2' }
        };

        rerender({ tr: newTrackRef as any });

        expect(result.current.analyserNode.current).not.toBe(initialAnalyser);
    });
});
