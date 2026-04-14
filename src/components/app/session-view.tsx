'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useSessionContext, useSessionMessages } from '@livekit/components-react';
import type { ReceivedMessage } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import { analyzeCode } from '@/services/geminiCodeAnalysis';
import { runCode } from '@/utils/codeRunner';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { cn } from '@/lib/utils';
import { debug } from '@/lib/debug';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';
import { RoomStatusBar } from '@/components/app/room-status-bar';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { SettingsPanel } from '@/components/pre-interview/SettingsPanel';
import { VideoMonitor } from '@/components/interview/VideoMonitor';
import { WarningBanner } from '@/components/interview/WarningBanner';
import { Gear } from '@phosphor-icons/react';
import { VisionProctor } from '@/lib/proctoring/visionProctor';

const MotionBottom = motion.create('div');

const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut' as const,
  },
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}

interface SessionViewProps {
  appConfig: AppConfig;
  interviewToken?: string; // Token for redirect to evaluation page
  interviewDuration?: number; // Interview duration in minutes
  scheduledAt?: string; // Scheduled interview start time (ISO string)
}

// Extended message type with streaming info
interface StreamingMessage {
  id: string;
  timestamp: number;
  from: any;
  message: string;
  isStreaming: boolean;
  displayedLength: number;
  messageOrigin: 'local' | 'remote';
  type?: string;
  editTimestamp?: number;
}

export const SessionView = ({
  appConfig,
  interviewToken,
  interviewDuration,
  scheduledAt,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);

  // Confirmation modal state
  const [showExitModal, setShowExitModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Code Editor State
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [editorCode, setEditorCode] = useState('');
  const [isEditorSubmitted, setIsEditorSubmitted] = useState(false);
  const [editorOutput, setEditorOutput] = useState<{ text: string; isError: boolean } | null>(null);

  // Monitoring State
  const [warningState, setWarningState] = useState<{
    show: boolean;
    severity: 'warning' | 'error' | 'critical';
    message: string;
    countdown?: number;
  } | null>(null);

  const [visionWarning, setVisionWarning] = useState<string | null>(null);

  // Session Restoration (Refresh Handling)
  useEffect(() => {
    if (!interviewToken) return;

    const restoreSessionState = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';
        const res = await fetch(`${API_BASE_URL}/api/interviews/session-state/${interviewToken}`);

        if (!res.ok) {
          throw new Error('Failed to fetch session state');
        }

        const data = await res.json();
        debug.log('[Frontend] 🔄 Restoring session state:', data);

        // 1. Restore Transcript (historical messages are not re-injected; session resumes fresh)

        // 2. Restore Interview State (Code, Question)
        if (data.interview_state) {
          const state = data.interview_state;
          if (state.current_question) {
            setCurrentQuestion(state.current_question);
            setShowCodeEditor(true);
          }

          if (state.latest_code) {
            setEditorCode(state.latest_code);
          } else if (state.code_submissions && state.code_submissions.length > 0) {
            // Use last submission if no latest_code
            const lastSubmission = state.code_submissions[state.code_submissions.length - 1];
            setEditorCode(lastSubmission.code);
            setIsEditorSubmitted(true);
          }
        }

        // 3. Restore Timer
        if (data.remaining_minutes !== undefined) {
          setTimeRemaining(data.remaining_minutes * 60);
        }
      } catch (err) {
        debug.error('[Frontend] ❌ Failed to restore session state:', err);
      }
    };

    restoreSessionState();
  }, [interviewToken]);

  useEffect(() => {
    if (!session.isConnected || !session.room) return;

    let hideTimer: number;
    const proctor = new VisionProctor(session.room, (msg) => {
      setVisionWarning(msg);
      clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setVisionWarning(null), 5000);
    });

    proctor.start();
    return () => {
      proctor.stop();
      clearTimeout(hideTimer);
    };
  }, [session.isConnected, session.room]);
  const allMessages = React.useMemo(() => {
    return [...messages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [messages]);

  // DEBUG: Log all messages to verify reception
  useEffect(() => {
    debug.log('📨 MESSAGES DEBUG:', {
      totalMessages: allMessages.length,
      regularMessages: messages.length,

    });

    // Log FULL message details
    if (allMessages.length > 0) {
      debug.log('📋 FULL MESSAGE DETAILS:', JSON.stringify(allMessages[0], null, 2));
      debug.log('📋 Message content:', allMessages[0].message);
      debug.log('📋 Message from:', allMessages[0].from);
      debug.log('📋 Message type:', allMessages[0].type);
      debug.log('📋 Is local?', allMessages[0].from?.isLocal);
      debug.log('📋 From identity:', allMessages[0].from?.identity);
    }

    const agentMessages = allMessages.filter(msg => !msg.from?.isLocal);
    debug.log('🤖 AGENT MESSAGES COUNT:', agentMessages.length);
    if (agentMessages.length > 0) {
      debug.log('🤖 AGENT MESSAGES FULL:', agentMessages);
      agentMessages.forEach((msg, idx) => {
        debug.log(`🤖 Agent Message ${idx}:`, {
          id: msg.id,
          message: msg.message,
          from: msg.from,
          type: msg.type,
          timestamp: msg.timestamp,
        });
      });
    }
  }, [allMessages, messages]);

  // Transcript is always visible in one-to-one interview
  const chatOpen = true; // Always show transcript
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [streamingMessages, setStreamingMessages] = useState<StreamingMessage[]>([]);

  // Auto-scroll transcript when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [streamingMessages]);
  const streamingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const completedMessageIds = useRef<Set<string>>(new Set());
  const streamingMessageIds = useRef<Set<string>>(new Set());
  const allMessagesRef = useRef<ReceivedMessage[]>([]);

  // Keep ref in sync for event handlers
  useEffect(() => {
    allMessagesRef.current = allMessages;
  }, [allMessages]);

  // Check if there are pending agent messages (not yet displayed)
  const hasPendingAgentMessage = allMessages.some(msg => {
    const isAgentMessage = !msg.from?.isLocal;
    return isAgentMessage && !completedMessageIds.current.has(msg.id);
  });

  // Initialize interview start time when session connects
  useEffect(() => {
    if (session.isConnected && !interviewStartTime) {
      // Use scheduled time if available, otherwise use current time
      const startTime = scheduledAt ? new Date(scheduledAt) : new Date();
      setInterviewStartTime(startTime);

      // If we have duration, calculate initial time remaining
      if (interviewDuration) {
        const now = new Date();
        const elapsed = (now.getTime() - startTime.getTime()) / 60000; // minutes
        const remaining = Math.max(0, interviewDuration - elapsed);
        setTimeRemaining(remaining);
      }
    }
  }, [session.isConnected, scheduledAt, interviewDuration, interviewStartTime]);

  // Auto-enable camera on session connect
  useEffect(() => {
    if (session.isConnected && session.room?.localParticipant) {
      const enableCamera = async () => {
        try {
          // Check if camera is already enabled
          if (!session.room.localParticipant.isCameraEnabled) {
            debug.log('🚀 Auto-enabling camera on join...');
            await session.room.localParticipant.setCameraEnabled(true);
            debug.log('✅ Camera enabled successfully');
          }
        } catch (error) {
          debug.error('⚠️ Failed to auto-enable camera:', error);
        }
      };
      enableCamera();
    }
  }, [session.isConnected, session.room?.localParticipant]);

  // Enter fullscreen when interview starts
  useEffect(() => {
    if (session.isConnected && !isInterviewCompleted) {
      // Request fullscreen when interview starts
      const enterFullscreen = async () => {
        try {
          const element = document.documentElement; // Full page fullscreen
          if (element.requestFullscreen) {
            await element.requestFullscreen();
            debug.log('✅ Entered fullscreen mode');
          } else if ((element as any).webkitRequestFullscreen) {
            // Safari
            await (element as any).webkitRequestFullscreen();
            debug.log('✅ Entered fullscreen mode (Safari)');
          } else if ((element as any).mozRequestFullScreen) {
            // Firefox
            await (element as any).mozRequestFullScreen();
            debug.log('✅ Entered fullscreen mode (Firefox)');
          } else if ((element as any).msRequestFullscreen) {
            // IE/Edge
            await (element as any).msRequestFullscreen();
            debug.log('✅ Entered fullscreen mode (IE/Edge)');
          }
        } catch (error) {
          debug.warn('⚠️ Failed to enter fullscreen:', error);
          // Fullscreen might be blocked by browser policy, continue anyway
        }
      };

      // Small delay to ensure page is ready
      const timeout = setTimeout(() => {
        enterFullscreen();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [session.isConnected, isInterviewCompleted]);

  // Exit fullscreen when interview ends or disconnects
  useEffect(() => {
    if (isInterviewCompleted || !session.isConnected) {
      const exitFullscreen = async () => {
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
            debug.log('✅ Exited fullscreen mode');
          } else if ((document as any).webkitFullscreenElement) {
            // Safari
            await (document as any).webkitExitFullscreen();
            debug.log('✅ Exited fullscreen mode (Safari)');
          } else if ((document as any).mozFullScreenElement) {
            // Firefox
            await (document as any).mozCancelFullScreen();
            debug.log('✅ Exited fullscreen mode (Firefox)');
          } else if ((document as any).msFullscreenElement) {
            // IE/Edge
            await (document as any).msExitFullscreen();
            debug.log('✅ Exited fullscreen mode (IE/Edge)');
          }
        } catch (error) {
          debug.warn('⚠️ Failed to exit fullscreen:', error);
        }
      };

      // Only exit if we're actually in fullscreen and interview has ended
      if (isInterviewCompleted || (!session.isConnected && interviewStartTime)) {
        exitFullscreen();
      }
    }
  }, [isInterviewCompleted, session.isConnected, interviewStartTime]);

  // Handle fullscreen change events (user pressing ESC, etc.)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      // If user manually exits fullscreen during interview, we can optionally re-enter
      // But for now, we'll respect their choice and not force it back
      if (!isFullscreen && session.isConnected && !isInterviewCompleted) {
        debug.log('ℹ️ User exited fullscreen manually');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [session.isConnected, isInterviewCompleted]);

  // Update timer every second (display only). Do NOT redirect when local timer hits 0.
  // Only the server (interview_completed) can end the interview and trigger redirect.
  useEffect(() => {
    if (!interviewStartTime || !interviewDuration) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = (now.getTime() - interviewStartTime.getTime()) / 60000; // minutes
      const remaining = Math.max(0, interviewDuration - elapsed);
      setTimeRemaining(remaining);

      // When local timer hits 0: only update display to 00:00. Do NOT redirect or set completed.
      // The worker is the single source of truth; it will send interview_completed at 90%/100%
      // and only then we redirect (handled in data channel handler).
      if (remaining <= 0 && !isInterviewCompleted) {
        setTimeRemaining(0);
        debug.log('⏰ Timer reached 00:00 (display only). Waiting for server to send interview_completed.');
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [interviewStartTime, interviewDuration, isInterviewCompleted]);


  const handleUserTranscript = (
    payload: Uint8Array,
    _participant?: any,
    _kind?: any,
    topic?: string
  ) => {
    if (topic !== 'user-transcript') return;
    try {
      const data = JSON.parse(new TextDecoder().decode(payload));

      // ONLY handle user transcript types — skip everything else
      if (data.type !== 'userTranscript' && data.type !== 'user_transcript') {
        return;
      }

      setStreamingMessages(prev => {
        const existingIndex = prev.findIndex(m => m.id === data.id);
        if (existingIndex !== -1) {
          // Update if new content is longer (final replaces interim)
          if ((data.message?.length ?? 0) > (prev[existingIndex].message?.length ?? 0)) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...prev[existingIndex],
              message: data.message,
              displayedLength: data.message?.length ?? 0,
            };
            return updated;
          }
          return prev;
        }
        // New message — add it
        return [...prev, {
          id: data.id,
          timestamp: data.timestamp,
          from: data.from,
          message: data.message,
          isStreaming: false,
          displayedLength: data.message?.length ?? 0,
          messageOrigin: 'local',
          type: data.type,
        }];
      });
    } catch (e) {}
  };

  // Expose room info via console command
  useEffect(() => {
    const room = session.room;

    if (room) {
      // Create a function to get room info that can be called from console
      (window as any).getRoomInfo = () => {
        if (!room) {
          debug.log('❌ No room connected');
          return;
        }

        debug.log('🏠 ROOM INFORMATION:');
        debug.log('   Room Name:', room.name);
        debug.log('   Room SID:', (room as any).sid || 'N/A');
        debug.log('   Room State:', room.state);

        // Log local participant
        if (room.localParticipant) {
          debug.log('   Local Participant:', {
            identity: room.localParticipant.identity,
            sid: room.localParticipant.sid,
            name: room.localParticipant.name,
          });
        }

        // Log remote participants
        const remoteParticipants = Array.from(room.remoteParticipants.values());
        if (remoteParticipants.length > 0) {
          debug.log('   Remote Participants:', remoteParticipants.map(p => ({
            identity: p.identity,
            sid: p.sid,
            name: p.name,
            isAgent: p.isAgent,
          })));
        } else {
          debug.log('   Remote Participants: None');
        }

        return {
          roomName: room.name,
          roomState: room.state,
          localParticipant: room.localParticipant ? {
            identity: room.localParticipant.identity,
            sid: room.localParticipant.sid,
            name: room.localParticipant.name,
          } : null,
          remoteParticipants: remoteParticipants.map(p => ({
            identity: p.identity,
            sid: p.sid,
            name: p.name,
            isAgent: p.isAgent,
          })),
        };
      };

      // Log participant join/leave events to console
      const handleParticipantConnected = (participant: any) => {
        debug.log('✅ PARTICIPANT JOINED:', {
          identity: participant.identity,
          sid: participant.sid,
          name: participant.name,
          isAgent: participant.isAgent,
          room: room.name,
        });
      };

      const handleParticipantDisconnected = (participant: any, reason?: string) => {
        debug.log('❌ PARTICIPANT LEFT:', {
          identity: participant.identity,
          sid: participant.sid,
          name: participant.name,
          reason: reason,
          room: room.name,
        });
      };

      const handleTrackSubscribed = (track: any, _pub: any, participant: any) => {
        debug.log('🎧 Audio track subscribed:', {
          kind: track.kind,
          participant: participant.identity,
          source: track.source,
        });
      };

      debug.log('🔧 Registering event handlers...');

      // Register event handlers
      room.on('participantConnected', handleParticipantConnected);
      room.on('participantDisconnected', handleParticipantDisconnected);
      room.on('trackSubscribed', handleTrackSubscribed);
      room.on('dataReceived', handleUserTranscript);

      // Note: In LiveKit, dataReceived is a room-level event, not participant-level
      // The room.on('dataReceived') should handle all data channel messages

      debug.log('✅ Data channel and audio track handlers registered');

      return () => {
        room.off('participantConnected', handleParticipantConnected);
        room.off('participantDisconnected', handleParticipantDisconnected);
        room.off('trackSubscribed', handleTrackSubscribed);
        room.off('dataReceived', handleUserTranscript);
        delete (window as any).getRoomInfo;
      };
    }

    return () => {
      delete (window as any).getRoomInfo;
    };
  }, [session.room]); // Removed messages from dependencies

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
    compiler: true,
  };

  // Handle streaming text display for agent messages
  useEffect(() => {
    debug.log('🔄 Processing messages for display:', allMessages.length);
    allMessages.forEach((msg, idx) => {
      const isAgentMessage = !msg.from?.isLocal;

      debug.log(`📝 Processing message ${idx}:`, {
        id: msg.id,
        isAgentMessage,
        message: msg.message?.substring(0, 50),
        fromLocal: msg.from?.isLocal,
        alreadyCompleted: completedMessageIds.current.has(msg.id),
        alreadyStreaming: streamingMessageIds.current.has(msg.id),
      });

      if (isAgentMessage) {

        // If message is already completed, check if it needs updating (might be partial)
        if (completedMessageIds.current.has(msg.id)) {
          setStreamingMessages(prev => {
            const existing = prev.find(m => m.id === msg.id);
            // If it exists and is fully displayed with correct length, keep it
            if (existing && existing.message === msg.message && existing.displayedLength === msg.message.length && !existing.isStreaming) {
              return prev;
            }
            // Otherwise, update it (might be a new longer version replacing partial)
            return prev.map(m =>
              m.id === msg.id
                ? { ...m, message: msg.message, isStreaming: false, displayedLength: msg.message.length }
                : m
            );
          });
          return;
        }

        // Check if we're already streaming this message
        if (streamingMessageIds.current.has(msg.id)) {
          // But check if this is a longer version (full replacing partial)
          setStreamingMessages(prev => {
            const existing = prev.find(m => m.id === msg.id);
            if (existing && msg.message.length > existing.message.length && msg.message.startsWith(existing.message)) {
              // This is a longer version, replace it
              debug.log('🔄 Replacing partial streaming message with full version');
              // Clean up existing streaming interval
              if (streamingIntervals.current.has(existing.id)) {
                const interval = streamingIntervals.current.get(existing.id);
                if (interval) clearInterval(interval);
                streamingIntervals.current.delete(existing.id);
              }
              streamingMessageIds.current.delete(msg.id); // Remove from streaming set so it can restart
              return prev.filter(m => m.id !== msg.id); // Remove partial, will be added below
            }
            return prev;
          });
          // If we removed it above, continue to streaming logic below
          if (!streamingMessageIds.current.has(msg.id)) {
            // Continue to streaming logic below - don't return
          } else {
            return; // Already streaming same message
          }
        }

        // Start streaming this message (with proper initialization)
        const fullText = msg.message;
        const totalLength = fullText.length;

        // Smart Hybrid: Get initial display length based on message characteristics
        const getInitialDisplayLength = (text: string): number => {
          const firstWord = text.split(/\s+/)[0] || '';
          const firstWordLength = firstWord.length;

          // For very short messages (≤5 chars), show everything immediately
          if (text.length <= 5) {
            return text.length;
          }

          // For short messages (≤20 chars), show first word
          if (text.length <= 20) {
            return firstWordLength;
          }

          // For long messages, show first word but cap at 15 chars to avoid super long words
          return Math.min(firstWordLength, 15);
        };

        const initialDisplayLength = getInitialDisplayLength(fullText);

        // Determine streaming mode: character-by-character for short, word-by-word for long
        const useCharacterStreaming = totalLength < 20;

        // Use the calculated initial length (ensure it's valid)
        let currentDisplayLength = Math.max(1, Math.min(initialDisplayLength, totalLength));

        // Create initial streaming message (start with partial text visible)
        const streamingMsg: StreamingMessage = {
          id: msg.id,
          timestamp: msg.timestamp,
          from: msg.from,
          message: fullText,
          isStreaming: true,
          displayedLength: currentDisplayLength,
          messageOrigin: 'remote',
          type: msg.type,
          editTimestamp: (msg as any).editTimestamp,
        };

        streamingMessageIds.current.add(msg.id);
        debug.log('➕ Adding message to streamingMessages:', {
          id: msg.id,
          message: fullText.substring(0, 50),
          initialDisplayedLength: currentDisplayLength,
          totalLength,
          useCharacterStreaming,
        });
        setStreamingMessages(prev => {
          // Check for duplicates by ID
          if (prev.some(m => m.id === msg.id)) {
            debug.log('⚠️ Message already in streamingMessages (by ID), skipping');
            return prev;
          }

          // Check for duplicates by content and timestamp (within 2 seconds)
          // Also handle partial vs full message duplicates (remove partial, keep full)
          const existingMsg = prev.find(m =>
            m.messageOrigin === 'remote' &&
            Math.abs(m.timestamp - msg.timestamp) < 2000
          );

          if (existingMsg) {
            const existingText = existingMsg.message || '';

            // Exact match
            if (existingText === fullText) {
              debug.log('⚠️ Message already in streamingMessages (exact match), skipping');
              return prev;
            }

            // Check if one is a prefix of another (partial vs full message)
            if (fullText.startsWith(existingText)) {
              // New message is longer (full), replace old partial one
              debug.log('🔄 Replacing partial message with full message (removing partial)');
              // Remove the partial message and its streaming interval if it exists
              if (streamingIntervals.current.has(existingMsg.id)) {
                const interval = streamingIntervals.current.get(existingMsg.id);
                if (interval) clearInterval(interval);
                streamingIntervals.current.delete(existingMsg.id);
                streamingMessageIds.current.delete(existingMsg.id);
              }
              return prev
                .filter(m => m.id !== existingMsg.id) // Remove partial message
                .concat([streamingMsg]); // Add full message
            } else if (existingText.startsWith(fullText)) {
              // Existing message is longer (full), skip new partial one
              debug.log('⚠️ Message already in streamingMessages (existing is full, new is partial), skipping');
              return prev;
            }
          }

          debug.log('✅ Adding new message to streamingMessages, new count:', prev.length + 1);
          return [...prev, streamingMsg];
        });

        // Stream progressively (character-by-character for short, word-by-word for long)
        debug.log(`🎬 Starting streaming interval for message ${msg.id} (${useCharacterStreaming ? 'character' : 'word'} mode)`);
        const streamInterval = setInterval(() => {
          // Read current displayedLength from state to ensure we're always in sync
          setStreamingMessages(prev => {
            const existingMsg = prev.find(m => m.id === msg.id);
            if (!existingMsg) {
              // Message was removed, cleanup interval
              clearInterval(streamInterval);
              streamingIntervals.current.delete(msg.id);
              streamingMessageIds.current.delete(msg.id);
              return prev;
            }

            const currentLength = existingMsg.displayedLength || currentDisplayLength;

            if (currentLength < totalLength) {
              let newLength = currentLength;

              if (useCharacterStreaming) {
                // Character streaming: add 2-3 characters at a time
                const charsToAdd = Math.min(3, totalLength - currentLength);
                newLength = currentLength + charsToAdd;
              } else {
                // Word streaming: add 1-2 words at a time (keep spaces in split so length matches fullText)
                const words = fullText.split(/(\s+)/);
                const displayedText = fullText.slice(0, currentLength);
                const displayedTokens = displayedText.split(/(\s+)/);

                let nextTokenIndex = displayedTokens.length;
                const tokensToAdd = Math.min(2, Math.max(0, words.length - nextTokenIndex));
                nextTokenIndex += tokensToAdd;

                const newDisplayedText = words.slice(0, nextTokenIndex).join('');
                newLength = Math.min(newDisplayedText.length, totalLength);
              }

              // Clamp to total length
              newLength = Math.min(newLength, totalLength);

              debug.log(`📊 Streaming update for ${msg.id}:`, {
                currentLength,
                newLength,
                totalLength,
                progress: `${Math.round((newLength / totalLength) * 100)}%`,
                displayedText: fullText.substring(0, newLength),
              });

              // Auto-scroll to bottom while streaming
              if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
              }

              // Update the message with new length
              return prev.map(m =>
                m.id === msg.id
                  ? { ...m, displayedLength: newLength }
                  : m
              );
            } else {
              // Streaming complete
              debug.log(`✅ Streaming complete for ${msg.id}`);
              clearInterval(streamInterval);
              streamingIntervals.current.delete(msg.id);
              streamingMessageIds.current.delete(msg.id);
              completedMessageIds.current.add(msg.id);

              return prev.map(m =>
                m.id === msg.id
                  ? { ...m, isStreaming: false, displayedLength: fullText.length }
                  : m
              );
            }
          });
        }, useCharacterStreaming ? 30 : 50); // Faster for character streaming (30ms), slower for word streaming (50ms)

        streamingIntervals.current.set(msg.id, streamInterval);
      } else {
        // User messages (userTranscript from agent or local) - show in transcript
        setStreamingMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, {
            id: msg.id,
            timestamp: msg.timestamp,
            from: msg.from,
            message: msg.message,
            isStreaming: false,
            displayedLength: msg.message?.length ?? 0,
            messageOrigin: 'local',
            type: msg.type,
            editTimestamp: (msg as any).editTimestamp,
          }];
        });
      }
    });

    // Do NOT clear all intervals here - this effect runs whenever allMessages changes.
    // Clearing here would stop in-progress streaming when a new message arrives (AI transcript would cut off).
    // Intervals are cleared per-message when streaming completes, and all are cleared on unmount below.
  }, [allMessages]);

  // Clear all streaming intervals only on unmount
  useEffect(() => {
    return () => {
      streamingIntervals.current.forEach(interval => clearInterval(interval));
      streamingIntervals.current.clear();
    };
  }, []);

  // Automatic keyword detection removed - compiler now opens manually via button

  const handleRunCode = async (code: string, language: string) => {
    debug.log('🏃 Running code in browser...');
    return await runCode(code, language);
  };

  const handleSubmitCode = async (code: string, executionOutput?: string) => {
    debug.log('📤 Submitting code for AI analysis...');

    // 1. Analyze with Gemini for immediate conversational context
    const analysisResponse = await analyzeCode(currentQuestion, code, codeLanguage);

    // 2. Send message to AI agent via LiveKit data channel
    const room = session.room;
    if (room && room.localParticipant) {
      const analysisMessage = {
        type: 'code_submission',
        question: currentQuestion,
        code: code,
        language: codeLanguage,
        executionOutput: executionOutput || 'No output recorded',
        aiAnalysis: analysisResponse,
        timestamp: Date.now()
      };

      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(analysisMessage));
        await room.localParticipant.publishData(data, {
          reliable: true,
          topic: 'code-submission'
        });
        debug.log('📡 Code submission sent to AI agent.');
      } catch (err) {
        debug.error('❌ Failed to send code submission to agent:', err);
      }
    } else {
      debug.warn('⚠️ Cannot send code submission: Room not connected or local participant missing');
    }

    // 4. Update local state to reflect submission
    setIsEditorSubmitted(true);
    setEditorCode(code);
    if (executionOutput) {
      setEditorOutput({ text: executionOutput, isError: executionOutput.toLowerCase().includes('error') });
    }

    debug.log('🔒 Code submitted. Editor remains open in read-only mode.');
  };

  useEffect(() => {
    debug.log('📺 Streaming messages state:', {
      count: streamingMessages.length,
      messages: streamingMessages.map(m => ({
        id: m.id,
        message: m.message?.substring(0, 50),
        isStreaming: m.isStreaming,
        displayedLength: m.displayedLength,
        messageOrigin: m.messageOrigin,
      })),
    });

    // Log what ChatTranscript will receive
    debug.log('📤 ChatTranscript will receive:', {
      hidden: !chatOpen,
      chatOpen,
      messagesCount: streamingMessages.length,
      messages: streamingMessages,
    });

    // Auto-scroll when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [allMessages, chatOpen, streamingMessages.length]);

  const handleInterviewTerminated = (reason: string) => {
    debug.error('🚫 Interview Terminated:', reason);
    setIsInterviewCompleted(true);
    // You could redirect or show a critical error modal here
    alert(`Interview terminated: ${reason}`);
    window.location.href = '/';
  };

  return (
    <section className="bg-background relative z-10 h-screen w-full overflow-hidden flex flex-col" {...props}>
      {/* Room Status Bar with Timer */}
      <RoomStatusBar timeRemaining={timeRemaining} />
      {/* Theme + Settings in session (top-right) */}
      <div className="fixed top-2 right-4 z-[61] flex items-center gap-2">
        <ThemeToggle className="w-auto rounded-full border border-input bg-background/95 backdrop-blur-sm" />
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full border border-input bg-background/95 backdrop-blur-sm hover:bg-muted/50 text-foreground text-sm font-medium transition-colors"
          aria-label="Device and network settings"
        >
          <Gear size={18} weight="bold" /> Settings
        </button>
      </div>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Video Monitoring & Alerts */}
      <VideoMonitor
        onInterviewTerminated={handleInterviewTerminated}
        onWarningStateChange={setWarningState}
      />

      {warningState?.show && (
        <WarningBanner
          severity={warningState.severity}
          message={warningState.message}
          countdown={warningState.countdown}
        />
      )}

      {visionWarning && (
        <WarningBanner
          severity="warning"
          message={visionWarning}
        />
      )}

      {/* Main Content Area: Videos on left, Transcript on right (Google Meet style) */}
      <div className="flex-1 flex flex-row min-h-0 gap-4 pt-14 pb-20 px-4 md:px-6">
        {/* Left Side: Videos Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <TileLayout
            showCodeEditor={showCodeEditor}
            codeEditorProps={{
              language: codeLanguage,
              initialCode: editorCode || (codeLanguage === 'python' ? 'def solution():\n    # Write your code here\n    pass' : '// Write your code here'),
              question: currentQuestion,
              isSubmitted: isEditorSubmitted,
              initialOutput: editorOutput,
              onCodeSubmit: handleSubmitCode,
              onRunCode: handleRunCode,
              onCodeChange: setEditorCode,
              onOutputChange: setEditorOutput,
            }}
          />
        </div>

        {/* Right Side: Transcript Panel */}
        <div className="w-[400px] min-w-[350px] max-w-[450px] border-l border-input/50 bg-background/95 backdrop-blur-sm flex flex-col shrink-0">
          {/* Transcript Header */}
          <div className="px-4 py-3 border-b border-input/50 flex items-center justify-between shrink-0">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Transcript
            </h3>
            {hasPendingAgentMessage && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <span className="hidden md:inline">Speaking...</span>
              </div>
            )}
          </div>

          {/* Transcript Content */}
          <ScrollArea
            ref={scrollAreaRef}
            className="flex-1 px-4 py-4"
          >
            <ChatTranscript
              hidden={false}
              messages={(() => {
                const filtered = streamingMessages.filter(msg => {
                  // Show remote messages (agent/interviewer)
                  if (msg.messageOrigin === 'remote') return true;
                  // Show local messages only if they're userTranscript type (candidate speech)
                  if (msg.messageOrigin === 'local') {
                    const msgType = (msg as any).type;
                    return msgType === 'userTranscript' || msgType === 'chatMessage';
                  }
                  return false;
                });
                return filtered as any;
              })()}
              className="space-y-3"
            />
            {streamingMessages.length === 0 && (
              <div className="h-full flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground italic text-center px-4">
                  Transcript will appear here as the interview progresses...
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Controls - Fixed at Bottom */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="fixed inset-x-3 bottom-0 z-[1000] md:inset-x-12 pointer-events-none"
      >
        {appConfig.isPreConnectBufferEnabled && (
          <PreConnectMessage messages={messages} className="pb-4" />
        )}
        <div className="bg-background relative mx-auto max-w-2xl pb-3 md:pb-12 pointer-events-auto">
          <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
          <AgentControlBar
            controls={controls}
            isConnected={session.isConnected}
            onDisconnect={() => setShowExitModal(true)}
            compilerOpen={showCodeEditor}
            onCompilerOpenChange={(open) => {
              setShowCodeEditor(open);
              // When opening compiler, check if we should update or reset the question
              if (open) {
                const lastAgentMessage = [...allMessages]
                  .reverse()
                  .find(msg => !msg.from?.isLocal && msg.message);

                if (lastAgentMessage?.message && lastAgentMessage.message !== currentQuestion) {
                  // A new question (or feedback) is arriving. 
                  // If it looks like a new question (we can use a simple heuristic or just update if it changed)
                  // For now, if the question changed, we reset the submission state
                  debug.log('🆕 New question detected in compiler:', lastAgentMessage.message);
                  setCurrentQuestion(lastAgentMessage.message);
                  setIsEditorSubmitted(false);
                  setEditorOutput(null);

                  // Auto-detect language
                  const text = lastAgentMessage.message.toLowerCase();
                  if (text.includes('javascript') || text.includes('js')) setCodeLanguage('javascript');
                  else if (text.includes('python')) setCodeLanguage('python');
                  else if (text.includes('java')) setCodeLanguage('java');
                  else if (text.includes('c++') || text.includes('cpp')) setCodeLanguage('cpp');

                  // Initialize editor code
                  const initial = text.includes('javascript') || text.includes('js')
                    ? '// Write your code here'
                    : 'def solution():\n    # Write your code here\n    pass';
                  setEditorCode(initial);
                }
              }
            }}
          />
        </div>
      </MotionBottom>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              setShowExitModal(false);
            }
          }}
        >
          <div className="bg-background border border-input rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
            <h2 className="text-xl font-semibold">Exit Interview?</h2>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to exit the interview? You will be redirected to the evaluation page to view your progress so far.
            </p>
            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowExitModal(false);
                  setIsInterviewCompleted(true);

                  // Exit fullscreen first
                  try {
                    if (document.fullscreenElement) {
                      await document.exitFullscreen();
                    } else if ((document as any).webkitFullscreenElement) {
                      await (document as any).webkitExitFullscreen();
                    } else if ((document as any).mozFullScreenElement) {
                      await (document as any).mozCancelFullScreen();
                    } else if ((document as any).msFullscreenElement) {
                      await (document as any).msExitFullscreen();
                    }
                  } catch (error) {
                    debug.warn('Failed to exit fullscreen:', error);
                  }

                  // Disconnect from session
                  try {
                    await session.end();
                  } catch (error) {
                    debug.warn('Failed to disconnect:', error);
                  }

                  // Redirect to evaluation page
                  const token = interviewToken;
                  if (token) {
                    // Small delay to ensure disconnect is processed and transcript is saved
                    setTimeout(() => {
                      const evaluationUrl = `/evaluation/${token}`;
                      debug.log('🔄 Redirecting to evaluation page:', evaluationUrl);
                      window.location.href = evaluationUrl;
                    }, 1500); // Increased delay to ensure backend processes the disconnect
                  } else {
                    debug.warn('⚠️ No interview token available for redirect');
                    // Fallback: redirect to home or my interviews
                    setTimeout(() => {
                      window.location.href = '/my-interviews';
                    }, 1000);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Yes, Exit Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
