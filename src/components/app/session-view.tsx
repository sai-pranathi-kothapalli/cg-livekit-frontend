'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useSessionContext, useSessionMessages } from '@livekit/components-react';
import type { ReceivedMessage } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';
import { RoomStatusBar } from '@/components/app/room-status-bar';

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
  
  // Manual transcript messages state (for messages not picked up by useSessionMessages)
  const [manualTranscriptMessages, setManualTranscriptMessages] = useState<ReceivedMessage[]>([]);
  
  // Merge regular messages with manually captured transcript messages, removing duplicates
  // Deduplicate based on message content, timestamp, and origin (within 2 seconds)
  // Also handles partial vs full message duplicates (removes partial, keeps full)
  const allMessages = React.useMemo(() => {
    const combined = [...messages, ...manualTranscriptMessages];
    
    // Group messages by origin and timestamp bucket
    const messageGroups = new Map<string, ReceivedMessage[]>();
    
    combined.forEach(msg => {
      const timestampBucket = Math.floor((msg.timestamp || 0) / 2000);
      const origin = msg.from?.isLocal ? 'local' : 'remote';
      const groupKey = `${timestampBucket}-${origin}`;
      
      if (!messageGroups.has(groupKey)) {
        messageGroups.set(groupKey, []);
      }
      messageGroups.get(groupKey)!.push(msg);
    });
    
    // Within each group, remove duplicates and keep longest message (full vs partial)
    const result: ReceivedMessage[] = [];
    
    messageGroups.forEach((groupMessages) => {
      // Sort by length (longest first) to prioritize full messages
      groupMessages.sort((a, b) => (b.message?.length || 0) - (a.message?.length || 0));
      
      const seen: string[] = [];
      
      for (const msg of groupMessages) {
        const messageContent = msg.message || '';
        
        // Check if this message is a duplicate or prefix of an already seen message
        let isDuplicate = false;
        
        for (const seenContent of seen) {
          // Exact match
          if (seenContent === messageContent) {
            isDuplicate = true;
            break;
          }
          
          // Check if current message is a prefix of seen message (current is shorter)
          // Since we sorted longest first, seenContent should be longer
          if (seenContent.startsWith(messageContent)) {
            // Current is shorter prefix - skip it, keep the longer seen one
            isDuplicate = true;
            break;
          }
          
          // Check if seen message is a prefix of current (current is longer)
          if (messageContent.startsWith(seenContent)) {
            // Seen is shorter prefix - remove it and keep current (longer)
            const indexToRemove = result.findIndex(m => m.message === seenContent);
            if (indexToRemove >= 0) {
              result.splice(indexToRemove, 1);
            }
            const seenIndex = seen.indexOf(seenContent);
            if (seenIndex >= 0) {
              seen.splice(seenIndex, 1);
            }
            // Continue to add current message
            break;
          }
        }
        
        if (!isDuplicate) {
          seen.push(messageContent);
          result.push(msg);
        }
      }
    });
    
    // Sort result by timestamp to maintain order
    result.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    // Deduplicate local (user) messages by exact content so same transcript doesn't appear twice
    const seenLocalContent = new Set<string>();
    const deduped = result.filter(m => {
      if (m.from?.isLocal) {
        const content = (m.message || '').trim();
        if (!content) return true;
        if (seenLocalContent.has(content)) return false;
        seenLocalContent.add(content);
      }
      return true;
    });
    
    return deduped;
  }, [messages, manualTranscriptMessages]);
  
  // DEBUG: Log all messages to verify reception
  useEffect(() => {
    console.log('📨 MESSAGES DEBUG:', {
      totalMessages: allMessages.length,
      regularMessages: messages.length,
      manualMessages: manualTranscriptMessages.length,
    });
    
    // Log FULL message details
    if (allMessages.length > 0) {
      console.log('📋 FULL MESSAGE DETAILS:', JSON.stringify(allMessages[0], null, 2));
      console.log('📋 Message content:', allMessages[0].message);
      console.log('📋 Message from:', allMessages[0].from);
      console.log('📋 Message type:', allMessages[0].type);
      console.log('📋 Is local?', allMessages[0].from?.isLocal);
      console.log('📋 From identity:', allMessages[0].from?.identity);
    }
    
    const agentMessages = allMessages.filter(msg => !msg.from?.isLocal);
    console.log('🤖 AGENT MESSAGES COUNT:', agentMessages.length);
    if (agentMessages.length > 0) {
      console.log('🤖 AGENT MESSAGES FULL:', agentMessages);
      agentMessages.forEach((msg, idx) => {
        console.log(`🤖 Agent Message ${idx}:`, {
          id: msg.id,
          message: msg.message,
          from: msg.from,
          type: msg.type,
          timestamp: msg.timestamp,
        });
      });
    }
  }, [allMessages, messages, manualTranscriptMessages]);
  
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
  
  // Enter fullscreen when interview starts
  useEffect(() => {
    if (session.isConnected && !isInterviewCompleted) {
      // Request fullscreen when interview starts
      const enterFullscreen = async () => {
        try {
          const element = document.documentElement; // Full page fullscreen
          if (element.requestFullscreen) {
            await element.requestFullscreen();
            console.log('✅ Entered fullscreen mode');
          } else if ((element as any).webkitRequestFullscreen) {
            // Safari
            await (element as any).webkitRequestFullscreen();
            console.log('✅ Entered fullscreen mode (Safari)');
          } else if ((element as any).mozRequestFullScreen) {
            // Firefox
            await (element as any).mozRequestFullScreen();
            console.log('✅ Entered fullscreen mode (Firefox)');
          } else if ((element as any).msRequestFullscreen) {
            // IE/Edge
            await (element as any).msRequestFullscreen();
            console.log('✅ Entered fullscreen mode (IE/Edge)');
          }
        } catch (error) {
          console.warn('⚠️ Failed to enter fullscreen:', error);
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
            console.log('✅ Exited fullscreen mode');
          } else if ((document as any).webkitFullscreenElement) {
            // Safari
            await (document as any).webkitExitFullscreen();
            console.log('✅ Exited fullscreen mode (Safari)');
          } else if ((document as any).mozFullScreenElement) {
            // Firefox
            await (document as any).mozCancelFullScreen();
            console.log('✅ Exited fullscreen mode (Firefox)');
          } else if ((document as any).msFullscreenElement) {
            // IE/Edge
            await (document as any).msExitFullscreen();
            console.log('✅ Exited fullscreen mode (IE/Edge)');
          }
        } catch (error) {
          console.warn('⚠️ Failed to exit fullscreen:', error);
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
        console.log('ℹ️ User exited fullscreen manually');
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
  
  // Update timer every second
  useEffect(() => {
    if (!interviewStartTime || !interviewDuration) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = (now.getTime() - interviewStartTime.getTime()) / 60000; // minutes
      const remaining = Math.max(0, interviewDuration - elapsed);
      setTimeRemaining(remaining);
      
      // If time is up, trigger interview completion
      if (remaining <= 0 && !isInterviewCompleted) {
        setTimeRemaining(0);
        console.log('⏰ Timer reached 00:00 - triggering interview completion');
        
        // Mark as completed
        setIsInterviewCompleted(true);
        
        // Send completion signal via data channel to ensure agent knows
        // Get room from session if available
        const currentRoom = session?.room;
        if (currentRoom && currentRoom.localParticipant) {
          try {
            const completionSignal = JSON.stringify({
              type: 'time_limit_reached',
              message: 'Interview time has been completed. Please wrap up and redirect to evaluation.',
              token: interviewToken,
            });
            currentRoom.localParticipant.publishData(
              new TextEncoder().encode(completionSignal),
              { topic: 'lk-chat', reliable: true }
            );
            console.log('✅ Sent time limit reached signal to agent');
          } catch (e) {
            console.warn('⚠️ Failed to send time limit signal:', e);
          }
        }
        
        // Redirect to evaluation page after a delay
        if (interviewToken) {
          setTimeout(() => {
            const evaluationUrl = `/evaluation/${interviewToken}`;
            console.log('🔄 Redirecting to evaluation page:', evaluationUrl);
            window.location.href = evaluationUrl;
          }, 3000); // 3 second delay to allow agent to finish speaking
        }
      }
    }, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, [interviewStartTime, interviewDuration, isInterviewCompleted, session, interviewToken]);
  
  // Format time remaining for display
  const formatTimeRemaining = (minutes: number | null): string => {
    if (minutes === null) return '--:--';
    if (minutes <= 0) return '00:00';
    
    const totalSeconds = Math.floor(minutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Expose room info via console command
  useEffect(() => {
    const room = session.room;
    
    if (room) {
      // Create a function to get room info that can be called from console
      (window as any).getRoomInfo = () => {
        if (!room) {
          console.log('❌ No room connected');
          return;
        }
        
        console.log('🏠 ROOM INFORMATION:');
        console.log('   Room Name:', room.name);
        console.log('   Room SID:', (room as any).sid || 'N/A');
        console.log('   Room State:', room.state);
        
        // Log local participant
        if (room.localParticipant) {
          console.log('   Local Participant:', {
            identity: room.localParticipant.identity,
            sid: room.localParticipant.sid,
            name: room.localParticipant.name,
          });
        }
        
        // Log remote participants
        const remoteParticipants = Array.from(room.remoteParticipants.values());
        if (remoteParticipants.length > 0) {
          console.log('   Remote Participants:', remoteParticipants.map(p => ({
            identity: p.identity,
            sid: p.sid,
            name: p.name,
            isAgent: p.isAgent,
          })));
        } else {
          console.log('   Remote Participants: None');
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
        console.log('✅ PARTICIPANT JOINED:', {
          identity: participant.identity,
          sid: participant.sid,
          name: participant.name,
          isAgent: participant.isAgent,
          room: room.name,
        });
      };
      
      const handleParticipantDisconnected = (participant: any, reason?: string) => {
        console.log('❌ PARTICIPANT LEFT:', {
          identity: participant.identity,
          sid: participant.sid,
          name: participant.name,
          reason: reason,
          room: room.name,
        });
      };
      
      // Listen to data channel messages manually to debug
      // NOTE: Since useSessionMessages already picks up agentTranscript messages automatically,
      // we only need to manually add messages that aren't picked up (fallback only)
      const handleDataReceived = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
        try {
          const decoder = new TextDecoder();
          const text = decoder.decode(payload);
          const data = JSON.parse(text);
          
          console.log('📡 DATA CHANNEL MESSAGE RECEIVED:', {
            topic,
            participant: participant?.identity,
            participantSid: participant?.sid,
            isLocal: participant?.isLocal,
            kind,
            rawText: text,
            parsedData: data,
          });
          
          // Check for interview warning (2 minutes before end)
          if (data.type === 'interview_warning') {
            console.log('⚠️ Interview warning received:', data.message);
            // Could show a toast notification here
            return;
          }
          
          // Check for time remaining update
          if (data.type === 'time_remaining') {
            console.log('⏰ Time remaining update received:', data.time_remaining_minutes);
            if (typeof data.time_remaining_minutes === 'number') {
              setTimeRemaining(data.time_remaining_minutes);
            }
            return;
          }
          
          // Check for interview completion signal
          if (data.type === 'interview_completed') {
            console.log('✅ Interview completed signal received:', data);
            
            // Mark interview as completed (this will trigger fullscreen exit)
            setIsInterviewCompleted(true);
            
            // Use token from signal or from props
            const token = data.token || interviewToken;
            
            if (!token) {
              console.warn('⚠️ Interview completed but no token available for redirect');
              return;
            }
            
            // Show completion message
            if (data.message) {
              console.log('📢 Completion message:', data.message);
              // You could show a toast/notification here if needed
            }
            
            // Redirect to evaluation page after a short delay (allow time for final data save)
            setTimeout(() => {
              const evaluationUrl = `/evaluation/${token}`;
              console.log('🔄 Redirecting to evaluation page:', evaluationUrl);
              window.location.href = evaluationUrl;
            }, 3000); // 3 second delay to allow final data to be saved and closing message to finish
            
            return; // Don't process as transcript message
          }
          
          // Check if this is our transcript message (has "message" field)
          // Agent transcripts: sent by remote (agent). User transcripts: sent by agent on behalf of user, show as local
          const isAgentTranscript = data.type === 'agentTranscript' && participant && !participant.isLocal;
          const isUserTranscript = data.type === 'userTranscript'; // Accept from any participant (agent sends it)
          
          if (data.message && typeof data.message === 'string' && (isAgentTranscript || isUserTranscript)) {
            console.log(`✅ ${data.type} MESSAGE DETECTED:`, data.message.substring(0, 50));
            
            // For userTranscript, display as local (candidate) message; for agentTranscript use sending participant
            const displayFrom = isUserTranscript && room.localParticipant ? room.localParticipant : participant;
            
            // Always add transcript messages to ensure they display
            // We'll deduplicate in the allMessages merge logic
            setManualTranscriptMessages(prev => {
              const now = Date.now();
              
              // Check for duplicates within manual messages only (by content similarity)
              // Allow updates if new message is longer (partial -> full)
              const existingIndex = prev.findIndex(m => {
                const sameParticipant = m.from?.identity === displayFrom?.identity || m.from?.sid === displayFrom?.sid;
                const recentTimestamp = Math.abs((m.timestamp || 0) - now) < 5000; // Within 5 seconds
                const sameOrLongerMessage = data.message === m.message || 
                                           data.message.startsWith(m.message) || 
                                           m.message.startsWith(data.message);
                return sameParticipant && recentTimestamp && sameOrLongerMessage;
              });
              
              // Create a ReceivedMessage object - use displayFrom so userTranscript shows as local user
              const transcriptMessage: ReceivedMessage = {
                id: `transcript-${now}-${Math.random().toString(36).substring(2, 9)}`,
                timestamp: now,
                message: data.message,
                from: displayFrom,
                type: data.type || 'chatMessage', // agentTranscript or userTranscript
              };
              
              if (existingIndex >= 0) {
                const existing = prev[existingIndex];
                // If new message is longer (full replacing partial), update it
                if (data.message.length > (existing.message?.length || 0)) {
                  console.log('🔄 Updating existing transcript message with longer version');
                  const updated = [...prev];
                  updated[existingIndex] = transcriptMessage;
                  return updated;
                } else {
                  // New message is same or shorter, skip to avoid duplicates
                  console.log('⚠️ Duplicate or shorter transcript message, skipping');
                  return prev;
                }
              }
              
              // No existing message found, add new one
              console.log('✅ Adding new transcript message to manual messages state');
              return [...prev, transcriptMessage];
            });
          }
        } catch (e) {
          console.log('📡 DATA CHANNEL MESSAGE (non-JSON):', {
            topic,
            participant: participant?.identity,
            payload: new TextDecoder().decode(payload).substring(0, 100),
            error: e,
          });
        }
      };
      
      console.log('🔧 Registering event handlers...');
      
      // Register event handlers
      room.on('participantConnected', handleParticipantConnected);
      room.on('participantDisconnected', handleParticipantDisconnected);
      room.on('dataReceived', handleDataReceived);
      
      // Note: In LiveKit, dataReceived is a room-level event, not participant-level
      // The room.on('dataReceived') should handle all data channel messages
      
      console.log('✅ Data channel handler registered');
      
      return () => {
        room.off('participantConnected', handleParticipantConnected);
        room.off('participantDisconnected', handleParticipantDisconnected);
        room.off('dataReceived', handleDataReceived);
        delete (window as any).getRoomInfo;
      };
    }
    
    return () => {
      delete (window as any).getRoomInfo;
    };
  }, [session.room, messages]); // Include messages in dependencies so handler has latest value

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
  };

  // Handle streaming text display for agent messages
  useEffect(() => {
    console.log('🔄 Processing messages for display:', allMessages.length);
    allMessages.forEach((msg, idx) => {
      const isAgentMessage = !msg.from?.isLocal;
      console.log(`📝 Processing message ${idx}:`, {
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
              console.log('🔄 Replacing partial streaming message with full version');
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
        console.log('➕ Adding message to streamingMessages:', {
          id: msg.id,
          message: fullText.substring(0, 50),
          initialDisplayedLength: currentDisplayLength,
          totalLength,
          useCharacterStreaming,
        });
        setStreamingMessages(prev => {
          // Check for duplicates by ID
          if (prev.some(m => m.id === msg.id)) {
            console.log('⚠️ Message already in streamingMessages (by ID), skipping');
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
              console.log('⚠️ Message already in streamingMessages (exact match), skipping');
              return prev;
            }
            
            // Check if one is a prefix of another (partial vs full message)
            if (fullText.startsWith(existingText)) {
              // New message is longer (full), replace old partial one
              console.log('🔄 Replacing partial message with full message (removing partial)');
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
              console.log('⚠️ Message already in streamingMessages (existing is full, new is partial), skipping');
              return prev;
            }
          }
          
          console.log('✅ Adding new message to streamingMessages, new count:', prev.length + 1);
          return [...prev, streamingMsg];
        });
        
        // Stream progressively (character-by-character for short, word-by-word for long)
        console.log(`🎬 Starting streaming interval for message ${msg.id} (${useCharacterStreaming ? 'character' : 'word'} mode)`);
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
              
              console.log(`📊 Streaming update for ${msg.id}:`, {
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
              console.log(`✅ Streaming complete for ${msg.id}`);
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

  useEffect(() => {
    console.log('📺 Streaming messages state:', {
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
    console.log('📤 ChatTranscript will receive:', {
      hidden: !chatOpen,
      chatOpen,
      messagesCount: streamingMessages.length,
      messages: streamingMessages,
    });
    
    // Auto-scroll when new messages arrive
    const lastMessage = streamingMessages.at(-1);
    const lastMessageIsLocal = lastMessage?.messageOrigin === 'local';

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [streamingMessages, chatOpen]);

  return (
    <section className="bg-background relative z-10 h-screen w-full overflow-hidden flex flex-col" {...props}>
      {/* Room Status Bar with Timer */}
      <RoomStatusBar timeRemaining={timeRemaining} />
      
      {/* Main Content Area: Videos on left, Transcript on right (Google Meet style) */}
      <div className="flex-1 flex flex-row min-h-0 gap-4 pt-14 pb-20 px-4 md:px-6">
        {/* Left Side: Videos Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <TileLayout chatOpen={chatOpen} />
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
                    console.warn('Failed to exit fullscreen:', error);
                  }
                  
                  // Disconnect from session
                  try {
                    await session.end();
                  } catch (error) {
                    console.warn('Failed to disconnect:', error);
                  }
                  
                  // Redirect to evaluation page
                  const token = interviewToken;
                  if (token) {
                    // Small delay to ensure disconnect is processed and transcript is saved
                    setTimeout(() => {
                      const evaluationUrl = `/evaluation/${token}`;
                      console.log('🔄 Redirecting to evaluation page:', evaluationUrl);
                      window.location.href = evaluationUrl;
                    }, 1500); // Increased delay to ensure backend processes the disconnect
                  } else {
                    console.warn('⚠️ No interview token available for redirect');
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
