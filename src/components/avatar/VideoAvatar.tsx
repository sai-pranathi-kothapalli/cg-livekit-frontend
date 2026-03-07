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
        <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center">
            {/* Static Avatar - Professional placeholder */}
            <div className="relative flex flex-col items-center justify-center">
                {/* Avatar Circle with subtle pulse when speaking */}
                <div
                    className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl transition-all duration-500 ${finalIsSpeaking ? 'scale-110 shadow-blue-500/50' : 'scale-100'
                        }`}
                >
                    {/* Animated ring when speaking */}
                    {finalIsSpeaking && (
                        <div className="absolute inset-0 rounded-full border-4 border-blue-400/50 animate-ping" />
                    )}

                    {/* Initial/Icon */}
                    <svg
                        className="w-16 h-16 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                </div>

                {/* Status indicator */}
                <div className="mt-4 flex items-center gap-2">
                    <div
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${finalIsSpeaking
                                ? 'bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50'
                                : 'bg-slate-400'
                            }`}
                    />
                    <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                        {finalIsSpeaking ? 'Speaking' : 'Ready'}
                    </span>
                </div>
            </div>

            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>
        </div>
    );
}
