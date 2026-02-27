'use client';

import { useSessionContext, useAgent, useRemoteParticipants } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { debug } from '@/lib/debug';

interface RoomStatusBarProps {
  timeRemaining?: number | null; // Time remaining in minutes
}

export function RoomStatusBar({ timeRemaining: _timeRemaining = null }: RoomStatusBarProps = {}) {
  const session = useSessionContext();
  const room = session.room;
  const agent = useAgent();
  const remoteParticipants = useRemoteParticipants();

  const [info, setInfo] = useState<{
    roomSid: string | null;
    localSid: string | null;
    remoteSids: Array<{ identity: string; sid: string; name: string | null }>;
  }>({ roomSid: null, localSid: null, remoteSids: [] });

  // Internet connectivity state
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });
  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);

  // Agent health status
  const [agentHealthStatus, setAgentHealthStatus] = useState<'healthy' | 'connecting' | 'destroyed' | 'unknown'>('unknown');

  // Monitor browser online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      debug.log('🌐 Internet connection restored');
    };
    const handleOffline = () => {
      setIsOnline(false);
      debug.warn('⚠️ Internet connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor LiveKit connection state
  useEffect(() => {
    if (!room) {
      setIsLiveKitConnected(false);
      return;
    }

    // Check initial state
    const checkState = () => {
      const state = room.state;
      const connected = state === 'connected';
      setIsLiveKitConnected(connected);
      if (connected) {
        debug.log('✅ LiveKit connected');
      } else {
        debug.log(`🔌 LiveKit state: ${state}`);
      }
    };

    checkState();

    // Use interval to poll room state (since there's no stateChanged event)
    const stateInterval = setInterval(checkState, 1000);

    const handleConnected = () => {
      setIsLiveKitConnected(true);
      debug.log('✅ LiveKit connected');
    };

    const handleDisconnected = () => {
      setIsLiveKitConnected(false);
      debug.warn('❌ LiveKit disconnected');
    };

    room.on('connected', handleConnected);
    room.on('disconnected', handleDisconnected);

    return () => {
      clearInterval(stateInterval);
      room.off('connected', handleConnected);
      room.off('disconnected', handleDisconnected);
    };
  }, [room]);

  useEffect(() => {
    if (!room) {
      setInfo({ roomSid: null, localSid: null, remoteSids: [] });
      return;
    }

    const update = () => {
      setInfo({
        roomSid: (room as any).sid || null,
        localSid: room.localParticipant?.sid || null,
        remoteSids: Array.from(room.remoteParticipants.values()).map((p) => ({
          identity: p.identity,
          sid: p.sid,
          name: p.name || null,
        })),
      });
    };

    update();

    room.on('participantConnected', update);
    room.on('participantDisconnected', update);

    return () => {
      room.off('participantConnected', update);
      room.off('participantDisconnected', update);
    };
  }, [room]);

  // Monitor agent health status
  useEffect(() => {
    if (!room || !isLiveKitConnected) {
      setAgentHealthStatus('unknown');
      return;
    }

    // Check for agent participant
    const agentParticipant = remoteParticipants.find(p => p.isAgent);

    // Check agent state if available
    if (agent) {
      const stateStr = agent.state as string;
      if (stateStr === 'failed' || stateStr === 'destroyed') {
        setAgentHealthStatus('destroyed');
      } else if (agent.state === 'connecting' || agent.state === 'initializing') {
        setAgentHealthStatus('connecting');
      } else if (stateStr === 'active' && agentParticipant) {
        setAgentHealthStatus('healthy');
      } else if (agentParticipant) {
        // Agent participant exists but state is unknown
        setAgentHealthStatus('healthy');
      } else {
        setAgentHealthStatus('connecting');
      }
    } else if (agentParticipant) {
      // Agent participant exists but agent hook not available
      setAgentHealthStatus('healthy');
    } else {
      // No agent participant found
      setAgentHealthStatus('connecting');
    }
  }, [room, isLiveKitConnected, agent, remoteParticipants]);

  // Determine overall connection status
  const connectionStatus = !isOnline
    ? 'offline'
    : !isLiveKitConnected
      ? 'connecting'
      : 'connected';

  // Get agent health status display
  const getAgentHealthDisplay = () => {
    switch (agentHealthStatus) {
      case 'healthy':
        return {
          label: 'Agent Healthy',
          dotColor: 'bg-green-500',
          textColor: 'text-green-600 dark:text-green-400',
          title: 'Agent is connected and responding'
        };
      case 'connecting':
        return {
          label: 'Agent Connecting',
          dotColor: 'bg-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          title: 'Agent is connecting or initializing'
        };
      case 'destroyed':
        return {
          label: 'Agent Destroyed',
          dotColor: 'bg-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          title: 'Agent connection has been terminated'
        };
      default:
        return {
          label: 'Agent Unknown',
          dotColor: 'bg-gray-500',
          textColor: 'text-gray-600 dark:text-gray-400',
          title: 'Agent status unknown'
        };
    }
  };

  const agentHealth = getAgentHealthDisplay();

  // Always show connectivity indicator, even if roomSid is not available yet
  return (
    <div className="fixed top-0 left-0 right-0 z-60 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          {/* Internet Connectivity Indicator - Always visible */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-colors shadow-sm ${connectionStatus === 'connected'
                    ? 'bg-green-500 animate-pulse'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-red-500'
                  }`}
                title={
                  connectionStatus === 'connected'
                    ? 'Connected - Internet and LiveKit are working'
                    : connectionStatus === 'connecting'
                      ? 'Connecting... - Waiting for LiveKit connection'
                      : 'No Internet Connection - Check your network'
                }
              />
              <span className={`text-xs font-semibold ${connectionStatus === 'connected'
                  ? 'text-green-600 dark:text-green-400'
                  : connectionStatus === 'connecting'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                {connectionStatus === 'connected'
                  ? 'Online'
                  : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Offline'}
              </span>
            </div>
          </div>

          {/* Timer hidden from candidate — time remaining not shown to user */}

          {/* Agent Health Status */}
          {isLiveKitConnected && (
            <div className="flex items-center gap-2 border-l border-input/50 pl-4">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-colors shadow-sm ${agentHealthStatus === 'healthy'
                      ? agentHealth.dotColor + ' animate-pulse'
                      : agentHealthStatus === 'connecting'
                        ? agentHealth.dotColor + ' animate-pulse'
                        : agentHealth.dotColor
                    }`}
                  title={agentHealth.title}
                />
                <span className={`text-xs font-semibold ${agentHealth.textColor}`}>
                  {agentHealth.label}
                </span>
              </div>
            </div>
          )}

          {/* Only show room info if available */}
          {info.roomSid && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Room:</span>
                <span className="text-foreground font-semibold">{info.roomSid}</span>
              </div>
              {info.localSid && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Local:</span>
                  <span className="text-foreground">{info.localSid}</span>
                </div>
              )}
            </>
          )}
        </div>
        {/* Participants section hidden - not useful for interview candidates */}
        {/* <div className="flex items-center gap-4">
          {info.remoteSids.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Participants:</span>
              <div className="flex items-center gap-2">
                {info.remoteSids.map((p, idx) => (
                  <span key={p.sid} className="text-foreground">
                    {p.name || p.identity} ({p.sid})
                    {idx < info.remoteSids.length - 1 && <span className="mx-1">•</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
}

