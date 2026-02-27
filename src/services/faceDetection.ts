import { FaceDetection } from '@mediapipe/face_detection';

let faceDetection: FaceDetection | null = null;
let isInitializing = false;

export async function initializeFaceDetection() {
    if (faceDetection) return faceDetection;
    if (isInitializing) {
        // Wait for initialization to complete if already in progress
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return faceDetection;
    }

    isInitializing = true;
    try {
        faceDetection = new FaceDetection({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
            }
        });

        faceDetection.setOptions({
            model: 'short',
            minDetectionConfidence: 0.5
        });

        await faceDetection.initialize();
        console.log('[FaceDetection] Initialized');
        return faceDetection;
    } finally {
        isInitializing = false;
    }
}

export async function detectFaceInVideo(videoElement: HTMLVideoElement): Promise<boolean> {
    if (!faceDetection) {
        await initializeFaceDetection();
    }

    if (!faceDetection) return false;

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.warn('[FaceDetection] Timeout waiting for results');
            resolve(false);
        }, 1000);

        faceDetection!.onResults((results) => {
            clearTimeout(timeout);
            const hasFace = results.detections.length > 0;
            resolve(hasFace);
        });

        faceDetection!.send({ image: videoElement });
    });
}
