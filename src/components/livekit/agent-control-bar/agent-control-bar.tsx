'use client';

import * as React from 'react';
import { type HTMLAttributes, useCallback, useState } from 'react';
import { Track } from 'livekit-client';
// import { useChat, useRemoteParticipants } from '@livekit/components-react';
import { useRemoteParticipants } from '@livekit/components-react';
import { PhoneDisconnectIcon } from '@phosphor-icons/react/dist/ssr';
// import { ChatTextIcon } from '@phosphor-icons/react/dist/ssr';
import { TrackToggle } from '@/components/livekit/agent-control-bar/track-toggle';
import { Button } from '@/components/livekit/button';
// import { Toggle } from '@/components/livekit/toggle';
import { cn } from '@/lib/utils';
// import { ChatInput } from './chat-input';
import { UseInputControlsProps, useInputControls } from './hooks/use-input-controls';
import { usePublishPermissions } from './hooks/use-publish-permissions';
import { TrackSelector } from './track-selector';
import { toastAlert } from '@/components/livekit/alert-toast';

export interface ControlBarControls {
  leave?: boolean;
  camera?: boolean;
  microphone?: boolean;
  screenShare?: boolean;
  chat?: boolean;
}

export interface AgentControlBarProps extends UseInputControlsProps {
  controls?: ControlBarControls;
  isConnected?: boolean;
  chatOpen?: boolean;
  onChatOpenChange?: (open: boolean) => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

/**
 * A control bar specifically designed for voice assistant interfaces
 */
export function AgentControlBar({
  controls,
  saveUserChoices = true,
  className,
  isConnected = false,
  chatOpen: chatOpenProp,
  onDisconnect,
  onDeviceError,
  onChatOpenChange,
  ...props
}: AgentControlBarProps & HTMLAttributes<HTMLDivElement>) {
  // const { send } = useChat(); // Commented out - chat not used for now
  const participants = useRemoteParticipants();
  // const [internalChatOpen, setInternalChatOpen] = useState(false); // Commented out - chat not used for now
  const publishPermissions = usePublishPermissions();
  
  // Enhanced error handler with logging and user-friendly messages
  const handleDeviceError = useCallback((error: { source: Track.Source; error: Error }) => {
    console.error('[AgentControlBar] Device error:', {
      source: error.source,
      error: error.error,
      message: error.error.message,
      stack: error.error.stack,
    });
    
    const errorMessage = error.error.message || '';
    const errorName = error.error.name || '';
    const deviceName = error.source === Track.Source.Microphone ? 'microphone' : 
                      error.source === Track.Source.Camera ? 'camera' : 
                      error.source === Track.Source.ScreenShare ? 'screen' : 'device';
    
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isSecureContext = window.isSecureContext;
    
    // Check for different error types
    const isGetUserMediaUndefined = errorMessage.includes('getUserMedia') || 
                                     errorMessage.includes('Cannot read properties of undefined');
    const isNoDeviceFound = errorMessage.includes('NotFoundError') || 
                            errorMessage.includes('No video input devices found') ||
                            errorMessage.includes('No audio input devices found') ||
                            errorMessage.includes('could not be found') ||
                            errorName === 'NotFoundError';
    const isPermissionDenied = errorMessage.includes('PermissionDeniedError') || 
                              errorMessage.includes('Permission denied') ||
                              errorMessage.includes('NotAllowedError') ||
                              errorName === 'NotAllowedError' ||
                              errorName === 'PermissionDeniedError';
    const isDeviceInUse = errorMessage.includes('DevicesInUse') ||
                          errorMessage.includes('device is already in use');
    
    let title = `Cannot access ${deviceName}`;
    let description: React.ReactNode = null;
    
    if (isGetUserMediaUndefined && protocol === 'http:' && !isLocalhost) {
      // HTTP vs HTTPS issue
      title = `HTTPS Required for ${deviceName}`;
      description = (
        <>
            <p className="w-full text-xs">
              Browser security requires <strong>HTTPS</strong> or <strong>localhost</strong> to access your {deviceName}.
              <br />
              <br />
              Current URL: <code className="text-xs bg-muted px-1 py-0.5 rounded">{protocol}//{hostname}</code>
              <br />
              <br />
              <strong>Solutions:</strong>
              <ul className="list-inside list-disc mt-1.5 space-y-0.5 text-xs">
                <li>Access via <code className="text-xs bg-muted px-1 py-0.5 rounded">localhost</code> instead of IP address</li>
                <li>Set up HTTPS for production use</li>
                <li>Use a reverse proxy with SSL certificate</li>
              </ul>
            </p>
        </>
      );
    } else if (isNoDeviceFound) {
      // No device available
      title = `${deviceName.charAt(0).toUpperCase() + deviceName.slice(1)} Not Found`;
      description = (
        <>
          <p className="w-full text-xs">
            No {deviceName} detected on your device.
            <br />
            <br />
            <strong>Please check:</strong>
            <ul className="list-inside list-disc mt-1.5 space-y-0.5 text-xs">
              {error.source === Track.Source.Camera && (
                <>
                  <li>Make sure a camera is connected to your computer</li>
                  <li>Check if the camera is enabled in system settings</li>
                  <li>Try unplugging and reconnecting the camera</li>
                  <li>Restart your browser</li>
                </>
              )}
              {error.source === Track.Source.Microphone && (
                <>
                  <li>Make sure a microphone is connected to your computer</li>
                  <li>Check if the microphone is enabled in system settings</li>
                  <li>Try unplugging and reconnecting the microphone</li>
                  <li>Restart your browser</li>
                </>
              )}
            </ul>
          </p>
        </>
      );
    } else if (isPermissionDenied) {
      // Permission denied
      title = `${deviceName.charAt(0).toUpperCase() + deviceName.slice(1)} Permission Denied`;
      description = (
        <>
          <p className="w-full text-xs">
            Browser blocked access to your {deviceName}.
            <br />
            <br />
            <strong>To fix this:</strong>
            <ul className="list-inside list-disc mt-1.5 space-y-0.5 text-xs">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Allow {deviceName} access in site settings</li>
              <li>Refresh the page and try again</li>
            </ul>
          </p>
        </>
      );
    } else if (isDeviceInUse) {
      // Device already in use
      title = `${deviceName.charAt(0).toUpperCase() + deviceName.slice(1)} Already in Use`;
      description = (
        <>
          <p className="w-full text-xs">
            Your {deviceName} is being used by another application.
            <br />
            <br />
            <strong>Please:</strong>
            <ul className="list-inside list-disc mt-1.5 space-y-0.5 text-xs">
              <li>Close other applications using the {deviceName}</li>
              <li>Check video conferencing apps (Zoom, Teams, etc.)</li>
              <li>Try refreshing the page</li>
            </ul>
          </p>
        </>
      );
    } else {
      // Generic error
      title = `Cannot access ${deviceName}`;
      description = (
        <>
          <p className="w-full text-xs">
            Unable to access your {deviceName}.
            <br />
            <br />
            <strong>Please check:</strong>
            <ul className="list-inside list-disc mt-1.5 space-y-0.5 text-xs">
              <li>Browser permissions for {deviceName}</li>
              <li>No other application is using the {deviceName}</li>
              <li>Try refreshing the page</li>
              {protocol === 'http:' && !isLocalhost && (
                <li>Consider using HTTPS or localhost</li>
              )}
            </ul>
            {errorMessage && (
              <p className="mt-2 text-xs text-muted-foreground">
                Error: {errorMessage}
              </p>
            )}
          </p>
        </>
      );
    }
    
    // Show user-friendly toast notification
    toastAlert({
      title,
      description,
    });
    
    onDeviceError?.(error);
  }, [onDeviceError]);
  
  const {
    micTrackRef,
    cameraToggle,
    microphoneToggle,
    screenShareToggle,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleMicrophoneDeviceSelectError,
    handleCameraDeviceSelectError,
  } = useInputControls({ onDeviceError: handleDeviceError, saveUserChoices });
  
  // Check for HTTP/HTTPS issue proactively
  React.useEffect(() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices;
    
    if (protocol === 'http:' && !isLocalhost && !hasMediaDevices) {
      console.warn('[AgentControlBar] ⚠️ Media devices unavailable due to HTTP (non-localhost):', {
        protocol,
        hostname,
        hasMediaDevices,
        suggestion: 'Use HTTPS or localhost for microphone/camera access',
      });
    }
  }, []);
  
  // Debug logging
  React.useEffect(() => {
    console.log('[AgentControlBar] State:', {
      isConnected,
      publishPermissions,
      microphoneEnabled: microphoneToggle.enabled,
      microphonePending: microphoneToggle.pending,
      cameraEnabled: cameraToggle.enabled,
      cameraPending: cameraToggle.pending,
      screenShareEnabled: screenShareToggle.enabled,
      screenSharePending: screenShareToggle.pending,
      hasMediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
    });
  }, [isConnected, publishPermissions, microphoneToggle.enabled, microphoneToggle.pending, cameraToggle.enabled, cameraToggle.pending, screenShareToggle.enabled, screenShareToggle.pending]);

  // Use controlled chatOpen if provided, otherwise use internal state
  // Commented out - chat not used for now
  // const chatOpen = chatOpenProp !== undefined ? chatOpenProp : internalChatOpen;

  // const handleSendMessage = async (message: string) => {
  //   await send(message);
  // };

  // const handleToggleTranscript = useCallback(
  //   (open: boolean) => {
  //     if (chatOpenProp === undefined) {
  //       // Only update internal state if not controlled
  //       setInternalChatOpen(open);
  //     }
  //     onChatOpenChange?.(open);
  //   },
  //   [onChatOpenChange, chatOpenProp]
  // );

  const visibleControls = {
    leave: controls?.leave ?? true,
    microphone: controls?.microphone ?? publishPermissions.microphone,
    screenShare: controls?.screenShare ?? publishPermissions.screenShare,
    camera: controls?.camera ?? publishPermissions.camera,
    chat: controls?.chat ?? publishPermissions.data,
  };

  const isAgentAvailable = participants.some((p) => p.isAgent);

  return (
    <div
      aria-label="Voice assistant controls"
      className={cn(
        'bg-background border-input/50 dark:border-muted flex flex-col rounded-[31px] border p-3 drop-shadow-md/3',
        className
      )}
      {...props}
    >
      {/* Chat Input - Commented out for now */}
      {/* {visibleControls.chat && (
        <ChatInput
          chatOpen={chatOpen}
          isAgentAvailable={isAgentAvailable}
          onSend={handleSendMessage}
        />
      )} */}

      <div className="flex gap-1">
        <div className="flex grow gap-1">
          {/* Toggle Microphone */}
          {visibleControls.microphone && (
            <TrackSelector
              kind="audioinput"
              aria-label="Toggle microphone"
              source={Track.Source.Microphone}
              pressed={microphoneToggle.enabled}
              disabled={microphoneToggle.pending || !isConnected}
              audioTrackRef={micTrackRef}
              onPressedChange={(pressed) => {
                console.log('[AgentControlBar] Mic button clicked:', { pressed, isConnected, pending: microphoneToggle.pending });
                if (isConnected && !microphoneToggle.pending) {
                  microphoneToggle.toggle(pressed);
                } else {
                  console.warn('[AgentControlBar] Mic toggle blocked:', { isConnected, pending: microphoneToggle.pending });
                }
              }}
              onMediaDeviceError={handleMicrophoneDeviceSelectError}
              onActiveDeviceChange={handleAudioDeviceChange}
            />
          )}

          {/* Toggle Camera */}
          {visibleControls.camera && (
            <TrackSelector
              kind="videoinput"
              aria-label="Toggle camera"
              source={Track.Source.Camera}
              pressed={cameraToggle.enabled}
              pending={cameraToggle.pending}
              disabled={cameraToggle.pending || !isConnected}
              onPressedChange={(pressed) => {
                console.log('[AgentControlBar] Camera button clicked:', { pressed, isConnected, pending: cameraToggle.pending });
                if (isConnected && !cameraToggle.pending) {
                  cameraToggle.toggle(pressed);
                } else {
                  console.warn('[AgentControlBar] Camera toggle blocked:', { isConnected, pending: cameraToggle.pending });
                }
              }}
              onMediaDeviceError={handleCameraDeviceSelectError}
              onActiveDeviceChange={handleVideoDeviceChange}
            />
          )}

          {/* Toggle Screen Share */}
          {visibleControls.screenShare && (
            <TrackToggle
              size="icon"
              variant="secondary"
              aria-label="Toggle screen share"
              source={Track.Source.ScreenShare}
              pressed={screenShareToggle.enabled}
              disabled={screenShareToggle.pending || !isConnected}
              onPressedChange={(pressed) => {
                console.log('[AgentControlBar] Screen share button clicked:', { pressed, isConnected, pending: screenShareToggle.pending });
                if (isConnected && !screenShareToggle.pending) {
                  screenShareToggle.toggle(pressed);
                } else {
                  console.warn('[AgentControlBar] Screen share toggle blocked:', { isConnected, pending: screenShareToggle.pending });
                }
              }}
            />
          )}

          {/* Toggle Transcript - Commented out for now */}
          {/* <Toggle
            size="icon"
            variant="secondary"
            aria-label="Toggle transcript"
            pressed={chatOpen}
            onPressedChange={handleToggleTranscript}
          >
            <ChatTextIcon weight="bold" />
          </Toggle> */}
        </div>

        {/* Disconnect */}
        {visibleControls.leave && (
          <Button
            variant="destructive"
            onClick={onDisconnect}
            disabled={!isConnected}
            className="font-mono"
          >
            <PhoneDisconnectIcon weight="bold" />
            <span className="hidden md:inline">END CALL</span>
            <span className="inline md:hidden">END</span>
          </Button>
        )}
      </div>
    </div>
  );
}
