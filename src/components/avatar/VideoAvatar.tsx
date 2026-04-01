import { useEffect, useRef, useState } from 'react';
import type { TrackReference } from '@livekit/components-react';

interface VideoAvatarProps {
    /** Agent's audio track from LiveKit */
    agentAudioTrack: TrackReference | undefined;
    /** Whether the agent is currently speaking (optional, can be fallback) */
    agentState?: string;
}

/**
 * Static avatar placeholder shown when the agent's video stream is not available.
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

        // Initialize AudioContext and Analyser for visual feedback
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
        <div className="relative h-full w-full overflow-hidden bg-black flex items-center justify-center">
            {/* Talking Video Loop */}
            <video
                src="/videos/talking.mp4"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${finalIsSpeaking ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                autoPlay
                loop
                muted
                playsInline
            />

            {/* Idle Video Loop */}
            <video
                src="/videos/idle.mp4"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${!finalIsSpeaking ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                autoPlay
                loop
                muted
                playsInline
            />

            {/* Status indicator overlay (Optional, but kept for professional feel) */}
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <div
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${finalIsSpeaking
                        ? 'bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50'
                        : 'bg-emerald-400 shadow-lg shadow-emerald-400/20'
                        }`}
                />
                <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">
                    {finalIsSpeaking ? 'Agent Speaking' : 'Agent Ready'}
                </span>
            </div>

            {/* Subtle vignette for premium look */}
            <div className="absolute inset-0 z-15 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>
    );
}
