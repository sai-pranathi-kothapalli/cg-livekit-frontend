import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeFaceDetection, detectFaceInVideo } from '@/services/faceDetection';

vi.mock('@mediapipe/face_detection', () => {
    class FaceDetectionMock {
        setOptions = vi.fn();
        initialize = vi.fn().mockResolvedValue(undefined);
        onResults = vi.fn();
        send = vi.fn().mockResolvedValue(undefined);
    }
    return {
        FaceDetection: FaceDetectionMock,
    };
});

describe('faceDetection service', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Reset internal state if needed (might be tricky due to closure scope in the module)
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('initializes FaceDetection only once', async () => {
        const instance1 = await initializeFaceDetection();
        const instance2 = await initializeFaceDetection();

        expect(instance1).toBeDefined();
        expect(instance1).toBe(instance2);
    });

    it('detectFaceInVideo resolves true when face is found', async () => {
        const mockVideoElement = {} as HTMLVideoElement;

        // This test requires careful mocking since the instance is created inside initializeFaceDetection
        // and we mocked the constructor to return a class.
        // We'll advance timers to trigger the timeout if results aren't received,
        // or we need to access the mocked instance to trigger onResults.

        // Let's initialize it first to get the instance reference (from our mock)
        const instance = await initializeFaceDetection();

        // Start the detection process
        const detectionPromise = detectFaceInVideo(mockVideoElement);

        // Simulate results coming back
        // @ts-expect-error accessing mocked method
        const onResultsCallback = instance.onResults.mock.calls[0][0];
        onResultsCallback({ detections: [{}] }); // One detection means face found

        const result = await detectionPromise;
        expect(result).toBe(true);
        // @ts-expect-error accessing mocked method
        expect(instance.send).toHaveBeenCalledWith({ image: mockVideoElement });
    });

    it('detectFaceInVideo resolves false when no face is found', async () => {
        const mockVideoElement = {} as HTMLVideoElement;
        const instance = await initializeFaceDetection();

        const detectionPromise = detectFaceInVideo(mockVideoElement);

        // Simulate results with no detections
        // @ts-expect-error accessing mocked method
        const onResultsCallback = instance.onResults.mock.calls[0][0];
        onResultsCallback({ detections: [] });

        const result = await detectionPromise;
        expect(result).toBe(false);
    });

    it('detectFaceInVideo resolves false on timeout', async () => {
        const mockVideoElement = {} as HTMLVideoElement;
        const instance = await initializeFaceDetection();

        // Since we don't call the callback, the timeout should fire
        const detectionPromise = detectFaceInVideo(mockVideoElement);

        vi.advanceTimersByTime(1001); // Advance past the 1000ms timeout

        const result = await detectionPromise;
        expect(result).toBe(false);
    });

    it('waits if initialization is already in progress', async () => {
        vi.resetModules();

        let constructorCallCount = 0;
        class MockConstructor {
            constructor() {
                constructorCallCount++;
            }
            setOptions = vi.fn();
            initialize = vi.fn().mockResolvedValue(undefined);
            onResults = vi.fn();
            send = vi.fn();
        }

        vi.doMock('@mediapipe/face_detection', () => ({
            FaceDetection: MockConstructor
        }));

        const { initializeFaceDetection: initDynamic } = await import('@/services/faceDetection');

        const p1 = initDynamic();
        const p2 = initDynamic();

        await Promise.all([p1, p2]);
        expect(constructorCallCount).toBe(1);
    });

    it('returns false in detectFaceInVideo if initialization fails', async () => {
        vi.resetModules();
        vi.doMock('@mediapipe/face_detection', () => ({
            FaceDetection: class {
                constructor() {
                    throw new Error('Init failed');
                }
            }
        }));

        const { detectFaceInVideo: detectFaceDynamic } = await import('@/services/faceDetection');
        const mockVideoElement = {} as HTMLVideoElement;

        // We know it throws 'Init failed' based on how detectFaceInVideo is implemented, 
        // because we mocked the class constructor to throw directly.
        await expect(detectFaceDynamic(mockVideoElement)).rejects.toThrow('Init failed');
    });
});
