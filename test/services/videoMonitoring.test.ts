import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { videoMonitoringService } from '@/services/videoMonitoring';
import * as faceapi from 'face-api.js';

vi.mock('@mediapipe/face_detection', () => {
    class FaceDetectionMock {
        setOptions = vi.fn();
        onResults = vi.fn();
        send = vi.fn().mockResolvedValue(undefined);
    }
    return { FaceDetection: FaceDetectionMock };
});

vi.mock('@mediapipe/hands', () => {
    class HandsMock {
        setOptions = vi.fn();
        onResults = vi.fn();
        send = vi.fn().mockResolvedValue(undefined);
    }
    return { Hands: HandsMock };
});

vi.mock('face-api.js', () => ({
    nets: {
        tinyFaceDetector: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
        faceExpressionNet: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
        faceLandmark68Net: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
    },
    TinyFaceDetectorOptions: vi.fn(),
    detectSingleFace: vi.fn(),
}));

describe('videoMonitoring service', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes models on construction', async () => {
        vi.resetModules();
        await import('@/services/videoMonitoring');

        // @ts-expect-error accessing mock class constructor
        const faceapiMock = await import('face-api.js');
        expect(faceapiMock.nets.tinyFaceDetector.loadFromUri).toHaveBeenCalled();
    });

    it('returns empty object if models are not loaded', async () => {
        vi.resetModules();
        vi.doMock('face-api.js', () => ({
            nets: {
                tinyFaceDetector: { loadFromUri: vi.fn().mockImplementation(() => new Promise(() => { })) }, // Never resolves
                faceExpressionNet: { loadFromUri: vi.fn() },
                faceLandmark68Net: { loadFromUri: vi.fn() },
            }
        }));

        const { videoMonitoringService: dynamicService } = await import('@/services/videoMonitoring');
        const result = await dynamicService.processFrame({} as HTMLVideoElement);
        expect(result).toEqual({});
    });

    it('processes MediaPipe and Face-API streams successfully', async () => {
        vi.resetModules();

        // Mock a successful initialization
        vi.doMock('face-api.js', () => ({
            nets: {
                tinyFaceDetector: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
                faceExpressionNet: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
                faceLandmark68Net: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
            },
            TinyFaceDetectorOptions: vi.fn(),
            detectSingleFace: vi.fn().mockReturnValue({
                withFaceExpressions: vi.fn().mockResolvedValue({
                    expressions: { happy: 0.9, sad: 0.1 }
                })
            })
        }));

        const { videoMonitoringService: dynamicService } = await import('@/services/videoMonitoring');

        // Wait a tick for promises in constructor init to resolve
        await vi.runOnlyPendingTimersAsync();

        // Advance time to allow both 500ms and 2000ms intervals to pass
        vi.advanceTimersByTime(2500);

        const mockVideoElement = {} as HTMLVideoElement;
        const results = await dynamicService.processFrame(mockVideoElement);

        // Because we advanced time, it should have hit both MediaPipe and FaceAPI blocks
        expect(results.emotion).toBe('happy');
    });

    it('catches errors in Face-API processing', async () => {
        vi.resetModules();

        // Mock the debug module so we can spy on it
        const debugMock = { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
        vi.doMock('@/lib/debug', () => ({ debug: debugMock }));

        vi.doMock('face-api.js', () => ({
            nets: {
                tinyFaceDetector: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
                faceExpressionNet: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
                faceLandmark68Net: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
            },
            TinyFaceDetectorOptions: vi.fn(),
            detectSingleFace: vi.fn().mockReturnValue({
                withFaceExpressions: vi.fn().mockRejectedValue(new Error('FaceAPI Error'))
            })
        }));

        const { videoMonitoringService: dynamicService } = await import('@/services/videoMonitoring');
        await vi.runOnlyPendingTimersAsync();

        // Ensure intervals fire
        vi.advanceTimersByTime(2500);

        const mockVideoElement = {} as HTMLVideoElement;
        const results = await dynamicService.processFrame(mockVideoElement);

        expect(results.emotion).toBeUndefined(); // Should gracefully catch and return without emotion
        expect(debugMock.error).toHaveBeenCalledWith('❌ [VideoMonitoring] Face-API Error:', expect.any(Error));
    });

    it('catches initialization errors', async () => {
        vi.resetModules();

        // Mock the debug module
        const debugMock = { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
        vi.doMock('@/lib/debug', () => ({ debug: debugMock }));

        // Mock Face-API to throw on load to trigger init error
        vi.doMock('face-api.js', () => ({
            nets: {
                tinyFaceDetector: { loadFromUri: vi.fn().mockRejectedValue(new Error('Init Reject')) },
                faceExpressionNet: { loadFromUri: vi.fn() },
                faceLandmark68Net: { loadFromUri: vi.fn() },
            }
        }));

        await import('@/services/videoMonitoring');
        await vi.runOnlyPendingTimersAsync();

        expect(debugMock.error).toHaveBeenCalledWith('❌ Failed to load video monitoring models:', expect.any(Error));
    });

    it('allows registering callbacks', async () => {
        vi.resetModules();
        const { videoMonitoringService: dynamicService } = await import('@/services/videoMonitoring');
        await vi.runOnlyPendingTimersAsync();

        const faceCallback = vi.fn();
        const handCallback = vi.fn();

        dynamicService.onFaceResults(faceCallback);
        dynamicService.onHandResults(handCallback);

        expect(typeof dynamicService.onFaceResults).toBe('function');
        expect(typeof dynamicService.onHandResults).toBe('function');
    });

    it('sets locateFile correctly for MediaPipe models', async () => {
        vi.resetModules();
        let faceLocation = '';
        let handsLocation = '';

        vi.doMock('@mediapipe/face_detection', () => ({
            FaceDetection: class {
                constructor(config: any) {
                    if (config?.locateFile) faceLocation = config.locateFile('test-face.js');
                }
                setOptions = vi.fn();
            }
        }));

        vi.doMock('@mediapipe/hands', () => ({
            Hands: class {
                constructor(config: any) {
                    if (config?.locateFile) handsLocation = config.locateFile('test-hands.js');
                }
                setOptions = vi.fn();
            }
        }));

        await import('@/services/videoMonitoring');
        await vi.runOnlyPendingTimersAsync();

        expect(faceLocation).toBe('https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/test-face.js');
        expect(handsLocation).toBe('https://cdn.jsdelivr.net/npm/@mediapipe/hands/test-hands.js');
    });

    it('catches errors during MediaPipe processing', async () => {
        vi.resetModules();
        const debugMock = { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
        vi.doMock('@/lib/debug', () => ({ debug: debugMock }));

        vi.doMock('face-api.js', () => ({
            nets: {
                tinyFaceDetector: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
                faceExpressionNet: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
                faceLandmark68Net: { loadFromUri: vi.fn().mockResolvedValue(undefined) },
            },
            TinyFaceDetectorOptions: vi.fn(),
            detectSingleFace: vi.fn().mockReturnValue({
                withFaceExpressions: vi.fn().mockResolvedValue({
                    expressions: { happy: 0.9, sad: 0.1 }
                })
            })
        }));

        vi.doMock('@mediapipe/face_detection', () => ({
            FaceDetection: class {
                setOptions = vi.fn();
                send = vi.fn().mockRejectedValue(new Error('MediaPipe Error'));
            }
        }));

        const { videoMonitoringService: dynamicService } = await import('@/services/videoMonitoring');
        await vi.runOnlyPendingTimersAsync();

        vi.advanceTimersByTime(501); // Just enough to hit MediaPipe interval, not FaceAPI

        const mockVideoElement = {} as HTMLVideoElement;
        await dynamicService.processFrame(mockVideoElement);

        expect(debugMock.error).toHaveBeenCalledWith('❌ [VideoMonitoring] MediaPipe Error:', expect.any(Error));
    });
});
