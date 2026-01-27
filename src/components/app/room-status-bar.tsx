'use client';

import { useSessionContext } from '@livekit/components-react';
import { useEffect, useState } from 'react';

export function RoomStatusBar() {
  const session = useSessionContext();
  const room = session.room;
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

  // Monitor browser online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Internet connection restored');
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.warn('⚠️ Internet connection lost');
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
        console.log('✅ LiveKit connected');
      } else {
        console.log(`🔌 LiveKit state: ${state}`);
      }
    };

    checkState();

    // Use interval to poll room state (since there's no stateChanged event)
    const stateInterval = setInterval(checkState, 1000);

    const handleConnected = () => {
      setIsLiveKitConnected(true);
      console.log('✅ LiveKit connected');
    };
    
    const handleDisconnected = () => {
      setIsLiveKitConnected(false);
      console.warn('❌ LiveKit disconnected');
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

  // Determine overall connection status
  const connectionStatus = !isOnline 
    ? 'offline' 
    : !isLiveKitConnected 
    ? 'connecting' 
    : 'connected';

  // Always show connectivity indicator, even if roomSid is not available yet
  return (
    <div className="fixed top-0 left-0 right-0 z-60 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          {/* Internet Connectivity Indicator - Always visible */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div 
                className={`w-2.5 h-2.5 rounded-full transition-colors shadow-sm ${
                  connectionStatus === 'connected' 
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
              <span className={`text-xs font-semibold ${
                connectionStatus === 'connected'
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

