import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track, TrackPublication } from 'livekit-client';
import { videoMonitoringService, MonitoringState, Warning } from '@/services/videoMonitoring';
import { debug } from '@/lib/debug';

interface VideoMonitorProps {
    onWarning?: (warning: Warning) => void;
    onInterviewTerminated?: (reason: string) => void;
    onStateUpdate?: (state: Partial<MonitoringState>) => void;
    onWarningStateChange?: (state: {
        show: boolean;
        severity: 'warning' | 'error' | 'critical';
        message: string;
        countdown?: number;
    } | null) => void;
}

export function VideoMonitor({ onWarning, onInterviewTerminated, onStateUpdate, onWarningStateChange }: VideoMonitorProps) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    const videoRef = useRef<HTMLVideoElement>(null);

    const [warningState] = useState<{
        show: boolean;
        severity: 'warning' | 'error' | 'critical';
        message: string;
        countdown?: number;
    } | null>(null);

    // Sync with parent
    useEffect(() => {
        onWarningStateChange?.(warningState);
    }, [warningState, onWarningStateChange]);

    // Explicitly track camera publication state using event listeners
    const [isMuted, setIsMuted] = useState(true);
    const [hasTrack, setHasTrack] = useState(false);
    const [cameraPub, setCameraPub] = useState<TrackPublication | undefined>();

    useEffect(() => {
        const updateTrackState = () => {
            const pub = localParticipant.getTrackPublication(Track.Source.Camera);
            setCameraPub(pub);
            setIsMuted(pub?.isMuted ?? true);
            setHasTrack(!!pub?.track);

            debug.log('📹 [VideoMonitor] Track Event:', {
                identity: localParticipant.identity,
                isMuted: pub?.isMuted,
                hasTrack: !!pub?.track,
                source: Track.Source.Camera
            });
        };

        // Listen for all relevant track events on the participant
        localParticipant.on('trackMuted', updateTrackState);
        localParticipant.on('trackUnmuted', updateTrackState);
        localParticipant.on('trackPublished', updateTrackState);
        localParticipant.on('trackUnpublished', updateTrackState);
        localParticipant.on('trackSubscribed', updateTrackState);
        localParticipant.on('trackUnsubscribed', updateTrackState);

        // Initial check
        updateTrackState();

        return () => {
            localParticipant.off('trackMuted', updateTrackState);
            localParticipant.off('trackUnmuted', updateTrackState);
            localParticipant.off('trackPublished', updateTrackState);
            localParticipant.off('trackUnpublished', updateTrackState);
            localParticipant.off('trackSubscribed', updateTrackState);
            localParticipant.off('trackUnsubscribed', updateTrackState);
        };
    }, [localParticipant]);

    const isCameraEnabled = useMemo(() => !isMuted && hasTrack, [isMuted, hasTrack]);

    const [monitoringState, setMonitoringState] = useState<MonitoringState>({
        faceDetected: false,
        faceCount: 0,
        emotion: 'neutral',
        headPose: { pitch: 0, yaw: 0, roll: 0 },
        handsNearFace: false,
        warnings: [],
        flags: [],
        cameraOffDuration: 0,
        lookingAwayCount: 0,
        lastFaceFeatures: null,
    });

    const stateRef = useRef(monitoringState);
    stateRef.current = monitoringState;

    // Trackers for rules
    const lookingAwayStart = useRef<number | null>(null);
    const handsNearFaceStart = useRef<number | null>(null);
    const activeWarningTypes = useRef<Set<string>>(new Set());

    // Setup MediaPipe callbacks
    useEffect(() => {
        videoMonitoringService.onFaceResults((results) => {
            const faceCount = results.detections.length;
            const faceDetected = faceCount > 0;

            let pitch = 0;
            let yaw = 0;
            if (faceDetected) {
                const box = results.detections[0].boundingBox;
                yaw = (0.5 - (box.xCenter + box.width / 2)) * 100;
                pitch = (0.5 - (box.yCenter + box.height / 2)) * 100;
            }

            setMonitoringState(prev => ({
                ...prev,
                faceDetected,
                faceCount,
                headPose: { pitch, yaw, roll: 0 }
            }));
        });

        videoMonitoringService.onHandResults((results) => {
            const handsDetected = results.multiHandLandmarks.length > 0;
            setMonitoringState(prev => ({ ...prev, handsNearFace: handsDetected }));
        });
    }, []);

    // Monitoring Loop
    useEffect(() => {
        let animationFrameId: number;

        const loop = async () => {
            const video = videoRef.current;
            if (video && video.readyState >= 2 && isCameraEnabled) {
                try {
                    const results = await videoMonitoringService.processFrame(video);
                    if (results.emotion) {
                        setMonitoringState(prev => ({ ...prev, emotion: results.emotion! }));
                    }
                } catch (err) {
                    debug.error('❌ [VideoMonitor] Loop Error:', err);
                }
            }

            if (onStateUpdate) onStateUpdate(stateRef.current);
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(animationFrameId);
    }, [onStateUpdate, isCameraEnabled]);

    // Rule Enforcement Logic
    useEffect(() => {
        const checkInterval = setInterval(() => {
            const now = Date.now();
            const s = stateRef.current;
            const newWarnings: Warning[] = [];

            // Camera check removed - users can continue interview without camera

            // 1. Multiple People Detection
            if (s.faceCount > 1) {
                addUniqueWarning(newWarnings, 'multiple_people', 'orange', 'Multiple people detected. Only you should be visible.');
                sendAlertToAgent('multiple_people_detected', { count: s.faceCount });
            } else {
                activeWarningTypes.current.delete('multiple_people-orange');
            }

            // 3. Looking Away Detection
            if (Math.abs(s.headPose.yaw) > 40 || s.headPose.pitch < -25) {
                if (!lookingAwayStart.current) lookingAwayStart.current = now;
                if ((now - lookingAwayStart.current) > 5000) {
                    addUniqueWarning(newWarnings, 'looking_away', 'yellow', 'Please keep your eyes on the screen');
                    setMonitoringState(prev => ({ ...prev, lookingAwayCount: prev.lookingAwayCount + 1 }));
                    lookingAwayStart.current = now;
                }
            } else {
                lookingAwayStart.current = null;
                activeWarningTypes.current.delete('looking_away-yellow');
            }

            // 4. Hand Near Face
            if (s.handsNearFace) {
                if (!handsNearFaceStart.current) handsNearFaceStart.current = now;
                if ((now - handsNearFaceStart.current) > 7000) {
                    addUniqueWarning(newWarnings, 'hand_near_face', 'yellow', 'Please keep your hands visible');
                    handsNearFaceStart.current = now;
                }
            } else {
                handsNearFaceStart.current = null;
                activeWarningTypes.current.delete('hand_near_face-yellow');
            }

            // Update state with active warnings for UI
            if (newWarnings.length > 0) {
                setMonitoringState(prev => ({ ...prev, warnings: newWarnings }));
            } else {
                setMonitoringState(prev => ({ ...prev, warnings: [] }));
            }

        }, 1000);

        return () => clearInterval(checkInterval);
    }, [onWarning, onInterviewTerminated, isCameraEnabled]);

    const addUniqueWarning = (list: Warning[], type: Warning['type'], level: Warning['level'], message: string) => {
        const warning: Warning = { id: `${type}-${level}-${Math.floor(Date.now() / 5000)}`, type, level, message, timestamp: Date.now() };
        list.push(warning);

        const eventKey = `${type}-${level}`;
        if (!activeWarningTypes.current.has(eventKey)) {
            debug.log(`📢 [VideoMonitor] Triggering warning callback: ${message}`);
            onWarning?.(warning);
            activeWarningTypes.current.add(eventKey);
        }
    };

    const sendAlertToAgent = useCallback((type: string, data: any) => {
        if (room?.localParticipant) {
            const payload = JSON.stringify({ type: 'monitoring_alert', alertType: type, ...data });
            room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true, topic: 'monitoring' });
        }
    }, [room]);

    // Sync video element with local camera track
    useEffect(() => {
        const videoTrack = cameraPub?.videoTrack;
        if (videoTrack && videoRef.current) {
            videoTrack.attach(videoRef.current);
            return () => {
                videoTrack.detach(videoRef.current!);
            };
        }
    }, [cameraPub]);

    return <video ref={videoRef} className="hidden" aria-hidden="true" />;
}
