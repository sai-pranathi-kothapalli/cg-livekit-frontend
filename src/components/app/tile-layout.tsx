import React, { useMemo, useState, useCallback } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarVisualizer,
  type TrackReference,
  VideoTrack,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from '@livekit/components-react';
import { cn } from '@/lib/utils';

const MotionContainer = motion.create('div');

const ANIMATION_TRANSITION = {
  type: 'spring' as const,
  stiffness: 675,
  damping: 75,
  mass: 1,
};

// One-to-one interview layout - simplified for candidate and agent
const classNames = {
  // One-to-one grid: 2 equal columns side by side
  grid: [
    'h-full w-full',
    'grid gap-4 place-content-center',
    'grid-cols-[1fr_1fr]',
  ],
};

export function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant();
  const publication = localParticipant.getTrackPublication(source);
  const trackRef = useMemo<TrackReference | undefined>(
    () => (publication ? { source, participant: localParticipant, publication } : undefined),
    [source, publication, localParticipant]
  );
  return trackRef;
}

interface TileLayoutProps {
  chatOpen: boolean;
  layoutMode?: 'side-by-side' | 'focused';
}

type FocusedView = 'interviewer' | 'candidate' | 'screenshare';

export function TileLayout({ chatOpen, layoutMode = 'side-by-side' }: TileLayoutProps) {
  const [focusedView, setFocusedView] = useState<FocusedView>('interviewer');
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: assistantVideoTrack,
  } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const cameraTrack: TrackReference | undefined = useLocalTrackRef(Track.Source.Camera);
  const { localParticipant } = useLocalParticipant();

  // Search for any remote video track (Tavus usually shows up here)
  // IMPORTANT: Filter out local participant's tracks to avoid duplicate video feeds
  const allVideoTracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const remoteVideoTracks = allVideoTracks.filter(
    (t) => !t.participant.isLocal && t.participant.identity !== localParticipant.identity
  );
  
  // Debug log to see who else is in the room
  console.log('Local participant identity:', localParticipant.identity);
  console.log('All video tracks:', allVideoTracks.map(t => ({ 
    identity: t.participant.identity, 
    isLocal: t.participant.isLocal 
  })));
  console.log('Remote participants:', remoteVideoTracks.map(t => t.participant.identity));

  const tavusTrack = remoteVideoTracks.find(
    (t) => t.participant.identity !== 'local' && t.participant.identity !== ''
  );

  const agentVideoTrack = assistantVideoTrack || tavusTrack;

  const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
  const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;
  
  // Get user's name and extract first initial
  const getUserInitial = useCallback(() => {
    const name = localParticipant?.name || localParticipant?.identity || '';
    // Extract first letter of first name
    const firstName = name.split(' ')[0] || name;
    return firstName.charAt(0).toUpperCase() || 'U';
  }, [localParticipant]);
  
  const userInitial = getUserInitial();
  
  // Generate a neutral, professional color based on the initial
  const getAvatarColor = useCallback((initial: string) => {
    // Use a subtle, professional color palette that works in both light and dark themes
    const colors = [
      'bg-slate-500', 'bg-gray-500', 'bg-zinc-500', 'bg-neutral-500',
      'bg-stone-500', 'bg-slate-600', 'bg-gray-600', 'bg-zinc-600'
    ];
    const index = initial.charCodeAt(0) % colors.length;
    return colors[index];
  }, []);
  
  const avatarColor = getAvatarColor(userInitial);
  
  // Auto-focus on screen share when it's active
  React.useEffect(() => {
    if (isScreenShareEnabled) {
      setFocusedView('screenshare');
    } else if (focusedView === 'screenshare') {
      // Return to interviewer when screen share ends
      setFocusedView('interviewer');
    }
  }, [isScreenShareEnabled]);
  
  const handleFocusChange = useCallback((view: FocusedView) => {
    // Don't allow focusing on screenshare if it's not active
    if (view === 'screenshare' && !isScreenShareEnabled) return;
    setFocusedView(view);
  }, [isScreenShareEnabled]);

  const animationDelay = chatOpen ? 0 : 0.15;
  const isAvatar = agentVideoTrack !== undefined;
  const videoWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const videoHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;

  // Render side-by-side layout (default)
  if (layoutMode === 'side-by-side') {
    return (
      <div className="pointer-events-none h-full w-full relative">
        <div className="relative h-full w-full">
          <div className={cn(classNames.grid, 'h-full')}>
            {/* Agent Video - Left Side */}
            <div className="flex items-center justify-center h-full">
              <AnimatePresence mode="wait">
                {!isAvatar && (
                  // Audio-only Agent (fallback)
                  <MotionContainer
                    key="agent-audio"
                    layoutId="agent"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={ANIMATION_TRANSITION}
                    className="bg-background w-full aspect-video rounded-lg border border-input/50 drop-shadow-lg flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <BarVisualizer
                        barCount={5}
                        state={agentState}
                        options={{ minHeight: 5 }}
                        trackRef={agentAudioTrack}
                        className="flex h-20 items-center justify-center gap-1"
                      >
                        <span
                          className={cn([
                            'bg-muted min-h-2.5 w-2.5 rounded-full',
                            'origin-center transition-colors duration-250 ease-linear',
                            'data-[lk-highlighted=true]:bg-foreground data-[lk-muted=true]:bg-muted',
                          ])}
                        />
                      </BarVisualizer>
                      <div className="text-center">
                        <p className="text-sm font-medium">Interviewer</p>
                        <p className="text-xs text-muted-foreground">Audio Only</p>
                      </div>
                    </div>
                  </MotionContainer>
                )}

                {isAvatar && (
                  // Agent Video
                  <MotionContainer
                    key="agent-video"
                    layoutId="agent"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={ANIMATION_TRANSITION}
                    className="relative w-full aspect-video rounded-lg overflow-hidden bg-black drop-shadow-xl border border-input/50"
                  >
                    <VideoTrack
                      width={videoWidth}
                      height={videoHeight}
                      trackRef={agentVideoTrack}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-sm font-medium text-white">Interviewer</p>
                    </div>
                  </MotionContainer>
                )}
              </AnimatePresence>
            </div>

            {/* Candidate Video - Right Side */}
            <div className="flex items-center justify-center h-full">
              <AnimatePresence mode="wait">
                {isCameraEnabled && cameraTrack && (
                  <MotionContainer
                    key="candidate-camera"
                    layoutId="candidate"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={ANIMATION_TRANSITION}
                    className="relative w-full aspect-video rounded-lg overflow-hidden bg-black drop-shadow-xl border border-input/50"
                  >
                    <VideoTrack
                      trackRef={cameraTrack}
                      width={cameraTrack.publication.dimensions?.width ?? 0}
                      height={cameraTrack.publication.dimensions?.height ?? 0}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-sm font-medium text-white">You</p>
                    </div>
                  </MotionContainer>
                )}
                
                {isScreenShareEnabled && screenShareTrack && (
                  <MotionContainer
                    key="candidate-screenshare"
                    layoutId="candidate"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={ANIMATION_TRANSITION}
                    className="relative w-full aspect-video rounded-lg overflow-hidden bg-black drop-shadow-xl border border-input/50"
                  >
                    <VideoTrack
                      trackRef={screenShareTrack}
                      width={screenShareTrack.publication.dimensions?.width ?? 0}
                      height={screenShareTrack.publication.dimensions?.height ?? 0}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-sm font-medium text-white">Screen Share</p>
                    </div>
                  </MotionContainer>
                )}

                {!isCameraEnabled && !isScreenShareEnabled && (
                  <MotionContainer
                    key="candidate-placeholder"
                    layoutId="candidate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={ANIMATION_TRANSITION}
                    className={cn("w-full aspect-video rounded-lg border border-input/50 flex items-center justify-center overflow-hidden", avatarColor)}
                  >
                    {/* Avatar with user's initial */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                        <span className="text-5xl font-bold text-white">{userInitial}</span>
                      </div>
                      <p className="text-sm font-medium text-white/90">Camera Off</p>
                    </div>
                  </MotionContainer>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render focused layout (WhatsApp/Google Meet style)
  // Determine what to show in main view vs thumbnail
  const showScreenShareInMain = focusedView === 'screenshare' && isScreenShareEnabled;
  const showInterviewerInMain = focusedView === 'interviewer' || (!isScreenShareEnabled && focusedView !== 'candidate');
  const showCandidateInMain = focusedView === 'candidate' && !isScreenShareEnabled;

  return (
    <div className="pointer-events-auto h-full w-full relative">
      <div className="relative h-full w-full flex flex-col gap-2">
        {/* Main Video Area - Takes most of the space */}
        <div className="flex-1 relative rounded-lg overflow-hidden bg-black">
          <AnimatePresence mode="wait">
            {/* Screen Share - Main View */}
            {showScreenShareInMain && screenShareTrack && (
              <MotionContainer
                key="main-screenshare"
                layoutId="main-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={ANIMATION_TRANSITION}
                className="absolute inset-0"
              >
                <VideoTrack
                  trackRef={screenShareTrack}
                  width={screenShareTrack.publication.dimensions?.width ?? 0}
                  height={screenShareTrack.publication.dimensions?.height ?? 0}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-base font-semibold text-white">Screen Share</p>
                </div>
              </MotionContainer>
            )}

            {/* Interviewer - Main View */}
            {showInterviewerInMain && !showScreenShareInMain && (
              <MotionContainer
                key="main-interviewer"
                layoutId="main-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={ANIMATION_TRANSITION}
                className="absolute inset-0"
              >
                {!isAvatar ? (
                  <div className="w-full h-full flex items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-6">
                      <BarVisualizer
                        barCount={5}
                        state={agentState}
                        options={{ minHeight: 5 }}
                        trackRef={agentAudioTrack}
                        className="flex h-24 items-center justify-center gap-1"
                      >
                        <span
                          className={cn([
                            'bg-muted min-h-3 w-3 rounded-full',
                            'origin-center transition-colors duration-250 ease-linear',
                            'data-[lk-highlighted=true]:bg-foreground data-[lk-muted=true]:bg-muted',
                          ])}
                        />
                      </BarVisualizer>
                      <div className="text-center">
                        <p className="text-lg font-semibold">Interviewer</p>
                        <p className="text-sm text-muted-foreground">Audio Only</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <VideoTrack
                      width={videoWidth}
                      height={videoHeight}
                      trackRef={agentVideoTrack}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-base font-semibold text-white">Interviewer</p>
                    </div>
                  </>
                )}
              </MotionContainer>
            )}

            {/* Candidate - Main View */}
            {showCandidateInMain && isCameraEnabled && cameraTrack && (
              <MotionContainer
                key="main-candidate"
                layoutId="main-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={ANIMATION_TRANSITION}
                className="absolute inset-0"
              >
                <VideoTrack
                  trackRef={cameraTrack}
                  width={cameraTrack.publication.dimensions?.width ?? 0}
                  height={cameraTrack.publication.dimensions?.height ?? 0}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-base font-semibold text-white">You</p>
                </div>
              </MotionContainer>
            )}
          </AnimatePresence>
        </div>

        {/* Thumbnail Bar - Small videos at bottom */}
        <div className="h-24 flex gap-2">
          {/* Interviewer Thumbnail */}
          {!showInterviewerInMain && (
            <div
              onClick={() => handleFocusChange('interviewer')}
              className={cn(
                "flex-1 rounded-lg overflow-hidden bg-black border-2 cursor-pointer transition-all",
                focusedView === 'interviewer' ? "border-blue-500 ring-2 ring-blue-500/50" : "border-transparent hover:border-input/50"
              )}
            >
              {!isAvatar ? (
                <div className="w-full h-full flex items-center justify-center bg-background">
                  <BarVisualizer
                    barCount={3}
                    state={agentState}
                    options={{ minHeight: 3 }}
                    trackRef={agentAudioTrack}
                    className="flex h-8 items-center justify-center gap-0.5"
                  >
                    <span className="bg-muted min-h-2 w-2 rounded-full" />
                  </BarVisualizer>
                </div>
              ) : (
                <VideoTrack
                  width={videoWidth}
                  height={videoHeight}
                  trackRef={agentVideoTrack}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <p className="text-xs font-medium text-white">Interviewer</p>
              </div>
            </div>
          )}

          {/* Candidate Thumbnail */}
          {!showCandidateInMain && isCameraEnabled && cameraTrack && (
            <div
              onClick={() => handleFocusChange('candidate')}
              className={cn(
                "flex-1 rounded-lg overflow-hidden bg-black border-2 cursor-pointer transition-all relative",
                focusedView === 'candidate' ? "border-blue-500 ring-2 ring-blue-500/50" : "border-transparent hover:border-input/50"
              )}
            >
              <VideoTrack
                trackRef={cameraTrack}
                width={cameraTrack.publication.dimensions?.width ?? 0}
                height={cameraTrack.publication.dimensions?.height ?? 0}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <p className="text-xs font-medium text-white">You</p>
              </div>
            </div>
          )}

          {/* Screen Share Thumbnail */}
          {!showScreenShareInMain && isScreenShareEnabled && screenShareTrack && (
            <div
              onClick={() => handleFocusChange('screenshare')}
              className={cn(
                "flex-1 rounded-lg overflow-hidden bg-black border-2 cursor-pointer transition-all relative",
                focusedView === 'screenshare' ? "border-blue-500 ring-2 ring-blue-500/50" : "border-transparent hover:border-input/50"
              )}
            >
              <VideoTrack
                trackRef={screenShareTrack}
                width={screenShareTrack.publication.dimensions?.width ?? 0}
                height={screenShareTrack.publication.dimensions?.height ?? 0}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <p className="text-xs font-medium text-white">Screen</p>
              </div>
            </div>
          )}

          {/* Placeholder when camera is off - Avatar with initial */}
          {!isCameraEnabled && !isScreenShareEnabled && !showCandidateInMain && (
            <div className={cn("flex-1 rounded-lg border border-input/50 flex items-center justify-center overflow-hidden", avatarColor)}>
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shadow-md">
                  <span className="text-2xl font-bold text-white">{userInitial}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
