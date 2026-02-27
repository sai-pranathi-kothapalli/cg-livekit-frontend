import { FaceMesh } from '@mediapipe/face_mesh';
import type { Room } from 'livekit-client';

export class VisionProctor {
  private faceMesh: FaceMesh;
  private room: Room;
  private intervalId: number | null = null;
  private isProcessing = false;
  private lastAlertTime = 0;
  private onAlertCallback: (message: string) => void;

  // State
  private lastFaceTime = Date.now();
  private lookingAwayStartTime: number | null = null;

  constructor(room: Room, onAlert: (message: string) => void) {
    this.room = room;
    this.onAlertCallback = onAlert;
    
    this.faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    this.faceMesh.setOptions({
      maxNumFaces: 2,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults(this.onResults.bind(this));
  }

  public start() {
    if (this.intervalId) return;
    this.lastFaceTime = Date.now();
    this.intervalId = window.setInterval(() => {
      this.processFrame();
    }, 1000);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private triggerAlert(message: string) {
    const now = Date.now();
    if (now - this.lastAlertTime < 3000) return; // Debounce 3 seconds
    
    this.lastAlertTime = now;
    this.onAlertCallback(message);

    if (this.room.localParticipant) {
      const payload = JSON.stringify({
        type: "vision_alert",
        message: message,
        timestamp: now
      });
      // Try to send via data channel, using a random bytes if needed, but LiveKit takes Uint8Array
      try {
        this.room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      } catch (e) {
        console.error("Failed to publish vision alert", e);
      }
    }
  }

  private async processFrame() {
    if (this.isProcessing) return;

    // 1. Check Camera OFF
    const videoTracks = Array.from(this.room.localParticipant?.videoTrackPublications.values() || []);
    const isCameraEnabled = videoTracks.some(t => !t.isMuted);
    
    // We get the video element as requested
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    
    if (this.room.localParticipant && !isCameraEnabled) {
      this.triggerAlert("Please turn on your camera.");
      return;
    }

    if (!videoElement || videoElement.readyState < 2) {
      return; // Skip if video element isn't ready
    }

    this.isProcessing = true;
    try {
      await this.faceMesh.send({ image: videoElement });
    } catch (e) {
      console.error('Vision Proctor Error', e);
    } finally {
      this.isProcessing = false;
    }
  }

  private onResults(results: any) {
    const now = Date.now();
    const faces = results.multiFaceLandmarks;

    // 2. No Face detected > 2 seconds
    if (!faces || faces.length === 0) {
      if (now - this.lastFaceTime > 2000) {
        this.triggerAlert("Ensure your face is clearly visible.");
      }
      return;
    }

    this.lastFaceTime = now;

    // 3. More than one face detected
    if (faces.length > 1) {
      this.triggerAlert("Only one person should be present.");
      return;
    }

    const landmarks = faces[0];
    
    // 4. Face Covered (eyes and nose not visible)
    // Face mesh returns array of 468+ landmarks. 
    // Left Eye roughly index 33, Right Eye index 263, Nose tip index 1
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];
    
    if (!leftEye || !rightEye || !nose) {
       this.triggerAlert("Do not cover your face.");
       return;
    }

    // 5. Looking Away for > 3 seconds
    // Estimate by checking nose deviation from eye center
    const eyeCenterPoint = (leftEye.x + rightEye.x) / 2;
    const deviation = Math.abs(nose.x - eyeCenterPoint);
    const eyeDistance = Math.abs(rightEye.x - leftEye.x);
    const yawRatio = deviation / (eyeDistance || 0.1);

    if (yawRatio > 0.4) {
      if (!this.lookingAwayStartTime) {
        this.lookingAwayStartTime = now;
      } else if (now - this.lookingAwayStartTime > 3000) {
        this.triggerAlert("Please maintain eye contact with the screen.");
        // reset start time so it doesn't spam every frame unless 3 seconds pass again
        this.lookingAwayStartTime = now; 
      }
    } else {
      this.lookingAwayStartTime = null;
    }
  }
}
