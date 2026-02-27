import { useEffect, useRef, useState } from 'react';
import type { TrackReference } from '@livekit/components-react';

interface VideoAvatarProps {
    /** Agent's audio track from LiveKit */
    agentAudioTrack: TrackReference | undefined;
    /** Whether the agent is currently speaking (optional, can be fallback) */
    agentState?: string;
}

/**
 * VideoAvatar Component
 * Switches between idle and talking videos based on audio presence.
 * Uses Web Audio API AnalyserNode to detect audio level in real-time.
 */
export function VideoAvatar({ agentAudioTrack, agentState }: VideoAvatarProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const track = agentAudioTrack?.publication?.track;
        if (!track || !(track instanceof MediaStreamTrack) || track.kind !== 'audio') {
            setIsSpeaking(false);
            return;
        }

        // Initialize AudioContext and Analyser
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;

        if (!analyserRef.current) {
            analyserRef.current = ctx.createAnalyser();
            analyserRef.current.fftSize = 256;
        }
        const analyser = analyserRef.current;

        // Create MediaStream from the track
        const mediaStream = new MediaStream([track]);
        sourceRef.current = ctx.createMediaStreamSource(mediaStream);
        sourceRef.current.connect(analyser);

        const dataArray = new Uint8Array(analyser.fftSize);
        const threshold = 0.01; // RMS threshold (0.0 to 1.0)

        const checkAudio = () => {
            analyser.getByteTimeDomainData(dataArray);

            // Calculate RMS (Root Mean Square) for volume detection
            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const normalized = (dataArray[i] / 128) - 1;
                sumSquares += normalized * normalized;
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);

            // Set speaking state based on threshold
            setIsSpeaking(rms > threshold);
            animationFrameRef.current = requestAnimationFrame(checkAudio);
        };

        checkAudio();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
        };
    }, [agentAudioTrack]);

    // Fallback if agentState is explicitly 'speaking'
    const finalIsSpeaking = isSpeaking || agentState === 'speaking';

    return (
        <div className="relative h-full w-full overflow-hidden bg-slate-900 flex items-center justify-center">
            {/* Talking Video (Shown when speaking) */}
            <video
                src="/videos/talking.mp4"
                autoPlay
                loop
                muted
                playsInline
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out ${finalIsSpeaking ? 'opacity-100' : 'opacity-0'
                    }`}
            />

            {/* Idle Video (Shown when silent) */}
            <video
                src="/videos/idle.mp4"
                autoPlay
                loop
                muted
                playsInline
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out ${finalIsSpeaking ? 'opacity-0' : 'opacity-100'
                    }`}
            />
        </div>
    );
}
