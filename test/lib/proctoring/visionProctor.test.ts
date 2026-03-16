import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisionProctor } from '@/lib/proctoring/visionProctor';
import { Room, Track, LocalParticipant } from 'livekit-client';

// Mock MediaPipe FaceMesh
vi.mock('@mediapipe/face_mesh', () => {
    class FaceMeshMock {
        setOptions = vi.fn();
        onResults = vi.fn();
        send = vi.fn().mockResolvedValue(undefined);
    }
    return {
        FaceMesh: FaceMeshMock,
    };
});

describe('VisionProctor', () => {
    let room: Room;
    let onAlert: any;
    let proctor: VisionProctor | null = null;
    const mockFullFace = new Array(500).fill({ x: 0.5, y: 0.5 });

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
        onAlert = vi.fn();

        // Mock LiveKit Room
        room = {
            localParticipant: {
                videoTrackPublications: new Map(),
                publishData: vi.fn().mockResolvedValue({}),
            } as unknown as LocalParticipant,
        } as unknown as Room;

        proctor = new VisionProctor(room, onAlert);
    });

    afterEach(() => {
        proctor?.stop();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('starts and stops the proctoring interval', () => {
        const setIntervalSpy = vi.spyOn(window, 'setInterval');
        const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

        proctor?.start();
        expect(setIntervalSpy).toHaveBeenCalled();

        proctor?.stop();
        expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('triggers an alert when the camera is off', async () => {
        const mockTrackPub = {
            source: Track.Source.Camera,
            isMuted: true,
        };
        (room.localParticipant?.videoTrackPublications as Map<any, any>).set('camera', mockTrackPub);

        proctor?.start();
        vi.advanceTimersByTime(1001);

        expect(onAlert).toHaveBeenCalledWith('Please turn on your camera.');
        expect(room.localParticipant?.publishData).toHaveBeenCalled();
    });

    it('debounces alerts', async () => {
        const mockTrackPub = {
            source: Track.Source.Camera,
            isMuted: true,
        };
        (room.localParticipant?.videoTrackPublications as Map<any, any>).set('camera', mockTrackPub);

        proctor?.start();
        vi.advanceTimersByTime(1001);
        vi.advanceTimersByTime(1001);

        expect(onAlert).toHaveBeenCalledTimes(1);
    });

    it('handles "no face detected" alert after 2 seconds', () => {
        // First result call with valid face to set lastFaceTime
        // @ts-expect-error accessing private method
        proctor?.onResults({ multiFaceLandmarks: [mockFullFace] });

        vi.advanceTimersByTime(2500);

        // Second result call with no landmarks
        // @ts-expect-error accessing private method
        proctor?.onResults({ multiFaceLandmarks: [] });
        expect(onAlert).toHaveBeenCalledWith('Ensure your face is clearly visible.');
    });

    it('handles "multiple faces detected" alert', () => {
        // @ts-expect-error accessing private method
        proctor?.onResults({ multiFaceLandmarks: [mockFullFace, mockFullFace] });
        expect(onAlert).toHaveBeenCalledWith('Only one person should be present.');
    });

    it('handles "looking away" alert after 3 seconds', () => {
        const mockLookingAway = new Array(500).fill({ x: 0, y: 0 });
        mockLookingAway[33] = { x: 0.4, y: 0.5 };
        mockLookingAway[263] = { x: 0.6, y: 0.5 };
        mockLookingAway[1] = { x: 0.7, y: 0.5 };

        // First call starts "looking away" timer
        // @ts-expect-error accessing private method
        proctor?.onResults({ multiFaceLandmarks: [mockLookingAway] });

        vi.advanceTimersByTime(3500);

        // Second call triggers the alert
        // @ts-expect-error accessing private method
        proctor?.onResults({ multiFaceLandmarks: [mockLookingAway] });
        expect(onAlert).toHaveBeenCalledWith('Please maintain eye contact with the screen.');
    });

    it('handles "face covered" alert', () => {
        // Call with missing landmarks in the array (e.g. only 1 landmark)
        // @ts-expect-error accessing private method
        proctor?.onResults({ multiFaceLandmarks: [[{ x: 0.5, y: 0.5 }]] });
        expect(onAlert).toHaveBeenCalledWith('Do not cover your face.');
    });

    it('processes a video frame', async () => {
        const mockVideo = { readyState: 4 } as HTMLVideoElement;
        const mockTrack = { attachedElements: [mockVideo] };
        const mockTrackPub = {
            source: Track.Source.Camera,
            isMuted: false,
            videoTrack: mockTrack,
        };
        (room.localParticipant?.videoTrackPublications as Map<any, any>).set('camera', mockTrackPub);

        proctor?.start();
        await vi.runOnlyPendingTimersAsync();

        // @ts-expect-error accessing private property
        expect(proctor?.faceMesh.send).toHaveBeenCalledWith({ image: mockVideo });
    });

    it('logs error when faceMesh.send fails', async () => {
        const mockVideo = { readyState: 4 } as HTMLVideoElement;
        const mockTrack = { attachedElements: [mockVideo] };
        const mockTrackPub = {
            source: Track.Source.Camera,
            isMuted: false,
            videoTrack: mockTrack,
        };
        (room.localParticipant?.videoTrackPublications as Map<any, any>).set('camera', mockTrackPub);

        // @ts-expect-error accessing private property
        vi.mocked(proctor?.faceMesh.send).mockRejectedValueOnce(new Error('Send failed'));
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        proctor?.start();
        await vi.runOnlyPendingTimersAsync();

        expect(errorSpy).toHaveBeenCalledWith('Vision Proctor Error', expect.any(Error));
        errorSpy.mockRestore();
    });

    it('logs error when publishData fails', async () => {
        const mockTrackPub = {
            source: Track.Source.Camera,
            isMuted: true,
        };
        (room.localParticipant?.videoTrackPublications as Map<any, any>).set('camera', mockTrackPub);

        // Mock a synchronous throw to cover the catch block in triggerAlert
        vi.mocked(room.localParticipant?.publishData).mockImplementationOnce(() => {
            throw new Error('Sync error');
        });

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        proctor?.start();
        vi.advanceTimersByTime(1001);

        expect(errorSpy).toHaveBeenCalledWith('Failed to publish vision alert', expect.any(Error));
        errorSpy.mockRestore();
    });
});
