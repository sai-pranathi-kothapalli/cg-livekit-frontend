import type { TrackReference } from '@livekit/components-react';
import { VideoAvatar } from './VideoAvatar';

interface InterviewerAvatarProps {
    /** Agent's audio track from LiveKit */
    agentAudioTrack: TrackReference | undefined;
    /** Current agent state (e.g., 'speaking', 'listening', 'thinking') */
    agentState?: string;
}

export function InterviewerAvatar({
    agentAudioTrack,
    agentState,
}: InterviewerAvatarProps) {
    // Note: The VideoAvatar component now handles its own audio analysis
    // and state switching between idle/talking internal videos.

    return (
        <div className="relative h-full w-full overflow-hidden bg-slate-900">
            {/* The Video Avatar - Now filling the entire container */}
            <div className="absolute inset-0 z-10 transition-transform duration-500">
                <VideoAvatar
                    agentAudioTrack={agentAudioTrack}
                    agentState={agentState}
                />
            </div>

            {/* Speaking/Thinking Overlays */}
            {agentState === 'thinking' && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                    <div className="flex gap-1.5 p-3 rounded-full bg-black/40 backdrop-blur-md">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/80" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/80" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/80" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}

            {/* Branding Overlay at the bottom (matches student video style) */}
            <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-wide">Interviewer</h3>
                        <div className="mt-1 flex items-center gap-1.5">
                            {agentState === 'speaking' ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                                    Speaking
                                </span>
                            ) : agentState === 'thinking' ? (
                                <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Thinking...</span>
                            ) : agentState === 'listening' ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                    Listening
                                </span>
                            ) : (
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest opacity-70">Active</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Speaking Border Glow Effect (Subtle) */}
            <div
                className={`absolute inset-0 z-20 pointer-events-none border-4 border-blue-500/0 transition-all duration-500 ${agentState === 'speaking' ? 'border-blue-500/30' : ''
                    }`}
                style={{
                    boxShadow: agentState === 'speaking' ? 'inset 0 0 40px rgba(59, 130, 246, 0.2)' : 'none'
                }}
            />
        </div>
    );
}

