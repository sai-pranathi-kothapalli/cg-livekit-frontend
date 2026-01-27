'use client';

import { useEffect, useRef, useMemo } from 'react';
import { 
  useSessionContext, 
  useSessionMessages, 
  useLocalParticipant,
  useRemoteParticipants,
  useTrackToggle
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { cn } from '@/lib/utils';

interface SimpleSessionViewProps {
  onDisconnect?: () => void;
}

export function SimpleSessionView({ onDisconnect }: SimpleSessionViewProps) {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Logic: Filter and process messages
  const displayMessages = useMemo(() => {
    return messages.filter(m => m.message && m.message.trim() !== '');
  }, [messages]);

  // 2. Logic: Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  // 3. Native Control Toggles (Building from scratch as requested)
  const micToggle = useTrackToggle({
    source: Track.Source.Microphone,
    room: session.room,
    onDeviceError: (e) => console.error('[MicToggle] device error', e),
  });
  const cameraToggle = useTrackToggle({
    source: Track.Source.Camera,
    room: session.room,
    onDeviceError: (e) => console.error('[CameraToggle] device error', e),
  });

  const isAgentSpeaking = remoteParticipants.some(p => p.isSpeaking);

  return (
    <div className="flex h-screen w-full flex-col bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      
      {/* TOP BAR: Status & Participants */}
      <header className="flex h-[4rem] shrink-0 items-center justify-between border-b border-white/10 px-[1.5rem] bg-[#0f0f0f]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-[0.75rem]">
          <div className={cn(
            "h-[0.625rem] w-[0.625rem] rounded-full animate-pulse",
            session.isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
          )} />
          <span className="text-[0.875rem] font-medium tracking-wide uppercase opacity-80">
            {session.isConnected ? 'Interview in Progress' : 'Connecting...'}
          </span>
        </div>
        
        <div className="flex items-center gap-[1rem] text-[0.75rem] font-mono opacity-60 bg-white/5 px-[0.75rem] py-[0.375rem] rounded-md border border-white/5">
          <span>ID: {session.room?.name || '...'}</span>
        </div>
      </header>

      {/* MAIN AREA: Split View (Transcript & Visualizer) */}
      <main className="grid flex-1 grid-cols-1 md:grid-cols-[1fr_24rem] overflow-hidden">
        
        {/* LEFT: Agent Visualizer & Chat */}
        <section className="relative flex flex-col items-center justify-center p-[2rem] overflow-hidden border-r border-white/5">
          
          {/* Agent Avatar / Pulse */}
          <div className="relative flex flex-col items-center gap-[2rem] mb-[4rem]">
            <div className={cn(
              "relative flex h-[12rem] w-[12rem] items-center justify-center rounded-full border-[2px] transition-all duration-500",
              isAgentSpeaking 
                ? "border-blue-500 scale-110 shadow-[0_0_40px_rgba(59,130,246,0.2)]" 
                : "border-white/10 scale-100"
            )}>
              <div className={cn(
                "h-[10rem] w-[10rem] rounded-full bg-gradient-to-br from-blue-600 to-indigo-900 transition-all duration-500 flex items-center justify-center",
                isAgentSpeaking ? "opacity-100" : "opacity-40 grayscale"
              )}>
                <span className="text-[3rem] font-bold text-white/20 select-none">A</span>
              </div>
              
              {/* Pulse Rings */}
              {isAgentSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full animate-ping border border-blue-500/50 opacity-20" />
                  <div className="absolute inset-[-1rem] rounded-full animate-pulse border border-blue-400/20" />
                </>
              )}
            </div>
            
            <div className="text-center space-y-[0.5rem]">
              <h2 className="text-[1.5rem] font-semibold tracking-tight">Alyza</h2>
              <p className="text-[0.875rem] text-blue-400 font-medium tracking-wider uppercase opacity-80">
                {isAgentSpeaking ? 'Speaking...' : 'Listening'}
              </p>
            </div>
          </div>

          {/* Overlay Transcript (Subtitles style) */}
          <div className="absolute bottom-[2rem] left-[2rem] right-[2rem] max-w-[40rem] mx-auto pointer-events-none">
            {displayMessages.slice(-1).map((msg) => (
              <div key={msg.id} className="bg-black/60 backdrop-blur-xl border border-white/10 p-[1.25rem] rounded-[1rem] animate-in fade-in slide-in-from-bottom-4 duration-300">
                <p className="text-[1.125rem] leading-relaxed text-white/90 text-center font-medium">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: Full Transcript Panel */}
        <aside className="hidden md:flex flex-col bg-black/20 overflow-hidden">
          <div className="p-[1.5rem] border-b border-white/5 shrink-0 bg-black/40">
            <h3 className="text-[0.875rem] font-bold uppercase tracking-widest opacity-50 text-center">Transcript</h3>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-[1.5rem] space-y-[1.25rem] scrollbar-thin scrollbar-thumb-white/10"
          >
            {displayMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col gap-[0.25rem] max-w-[85%]",
                  msg.from?.isLocal ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <span className="text-[0.625rem] font-bold uppercase tracking-tighter opacity-30 px-[0.5rem]">
                  {msg.from?.isLocal ? 'You' : 'Alyza'}
                </span>
                <div className={cn(
                  "p-[0.875rem] rounded-[1rem] text-[0.9375rem] leading-normal shadow-sm",
                  msg.from?.isLocal 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white/5 border border-white/10 text-white/80 rounded-tl-none"
                )}>
                  {msg.message}
                </div>
              </div>
            ))}
            {displayMessages.length === 0 && (
              <div className="h-full flex items-center justify-center opacity-20 italic text-[0.875rem]">
                Waiting for interaction...
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* BOTTOM BAR: Native Controls */}
      <footer className="flex h-[6rem] shrink-0 items-center justify-center gap-[1rem] border-t border-white/10 bg-[#0f0f0f] z-30">
        
        {/* Native Mic Button */}
        <button 
          onClick={async () => {
            try {
              await micToggle.toggle();
            } catch (e) {
              console.error('[MicToggle] toggle failed', e);
            }
          }}
          className={cn(
            "group relative flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full border transition-all duration-200",
            micToggle.enabled 
              ? "bg-white/5 border-white/10 hover:bg-white/10" 
              : "bg-red-500/20 border-red-500/50 hover:bg-red-500/30"
          )}
          title={micToggle.enabled ? "Mute Mic" : "Unmute Mic"}
        >
          <svg className={cn("h-[1.5rem] w-[1.5rem]", micToggle.enabled ? "text-white" : "text-red-500")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={micToggle.enabled ? "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} />
          </svg>
          <div className="absolute -top-[2.5rem] hidden group-hover:block bg-black text-white text-[0.75rem] px-2 py-1 rounded">Mic</div>
        </button>

        {/* Native Camera Button */}
        <button 
          onClick={async () => {
            try {
              await cameraToggle.toggle();
            } catch (e) {
              console.error('[CameraToggle] toggle failed', e);
            }
          }}
          className={cn(
            "group relative flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full border transition-all duration-200",
            cameraToggle.enabled 
              ? "bg-white/5 border-white/10 hover:bg-white/10" 
              : "bg-red-500/20 border-red-500/50 hover:bg-red-500/30"
          )}
        >
          <svg className={cn("h-[1.5rem] w-[1.5rem]", cameraToggle.enabled ? "text-white" : "text-red-500")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <div className="absolute -top-[2.5rem] hidden group-hover:block bg-black text-white text-[0.75rem] px-2 py-1 rounded">Camera</div>
        </button>

        {/* Separator */}
        <div className="h-[2.5rem] w-[1px] bg-white/10 mx-[0.5rem]" />

        {/* Native End Call Button */}
        <button 
          onClick={() => onDisconnect?.()}
          className="group relative flex h-[3.5rem] px-[2rem] items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest text-[0.875rem] transition-all duration-200 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
        >
          <span>END INTERVIEW</span>
          <div className="absolute -top-[2.5rem] hidden group-hover:block bg-black text-white text-[0.75rem] px-2 py-1 rounded whitespace-nowrap">Terminate Call</div>
        </button>

      </footer>
    </div>
  );
}

