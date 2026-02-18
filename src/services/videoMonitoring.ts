import { FaceDetection, Results as FaceResults } from '@mediapipe/face_detection';
import { Hands, Results as HandResults } from '@mediapipe/hands';
import * as faceapi from 'face-api.js';
import { debug } from '@/lib/debug';

export interface Warning {
    id: string;
    type: 'camera' | 'multiple_people' | 'looking_away' | 'hand_near_face' | 'identity';
    level: 'yellow' | 'orange' | 'red';
    message: string;
    timestamp: number;
}

export interface Flag {
    type: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: number;
    data?: any;
}

export interface MonitoringState {
    faceDetected: boolean;
    faceCount: number;
    emotion: string;
    headPose: { pitch: number; yaw: number; roll: number };
    handsNearFace: boolean;
    warnings: Warning[];
    flags: Flag[];
    cameraOffDuration: number;
    lookingAwayCount: number;
    lastFaceFeatures: any;
}

class VideoMonitoringService {
    private faceDetection: FaceDetection | null = null;
    private hands: Hands | null = null;
    private isModelsLoaded = false;
    private lastEmotionProcess = 0;
    private lastMediaPipeProcess = 0;

    constructor() {
        this.init();
    }

    private async init() {
        try {
            // 1. Initialize MediaPipe Face Detection
            this.faceDetection = new FaceDetection({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
            });
            this.faceDetection.setOptions({
                model: 'short',
                minDetectionConfidence: 0.5,
            });

            // 2. Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });
            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            // 3. Initialize Face-API.js (Emotions)
            // Loading models from CDN to ensure zero-setup functionality
            const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

            this.isModelsLoaded = true;
            debug.log('✅ Video Monitoring Models Loaded Successfully');
        } catch (error) {
            debug.error('❌ Failed to load video monitoring models:', error);
        }
    }

    public async processFrame(videoElement: HTMLVideoElement): Promise<Partial<MonitoringState>> {
        if (!this.isModelsLoaded) {
            debug.warn('⚠️ [VideoMonitoring] Models not loaded yet, skipping frame.');
            return {};
        }

        const now = Date.now();
        const results: Partial<MonitoringState> = {};

        // Process MediaPipe every 500ms
        if (now - this.lastMediaPipeProcess > 500) {
            this.lastMediaPipeProcess = now;
            debug.log('📸 [VideoMonitoring] Processing MediaPipe frame...');

            try {
                // Face detection
                await this.faceDetection?.send({ image: videoElement });
                // Hand detection
                await this.hands?.send({ image: videoElement });
            } catch (err) {
                debug.error('❌ [VideoMonitoring] MediaPipe Error:', err);
            }
        }

        // Process Face-API Emotions every 2 seconds
        if (now - this.lastEmotionProcess > 2000) {
            this.lastEmotionProcess = now;
            debug.log('📸 [VideoMonitoring] Processing Face-API emotion frame...');

            try {
                const detections = await faceapi.detectSingleFace(
                    videoElement,
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceExpressions();

                if (detections) {
                    const expressions = detections.expressions;
                    const dominantEmotion = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0];
                    results.emotion = dominantEmotion;
                    debug.log(`😊 [VideoMonitoring] Detected Emotion: ${dominantEmotion}`);
                }
            } catch (err) {
                debug.error('❌ [VideoMonitoring] Face-API Error:', err);
            }
        }

        return results;
    }

    // Helper to set face detection callback
    public onFaceResults(callback: (results: FaceResults) => void) {
        this.faceDetection?.onResults(callback);
    }

    // Helper to set hand detection callback
    public onHandResults(callback: (results: HandResults) => void) {
        this.hands?.onResults(callback);
    }
}

export const videoMonitoringService = new VideoMonitoringService();
