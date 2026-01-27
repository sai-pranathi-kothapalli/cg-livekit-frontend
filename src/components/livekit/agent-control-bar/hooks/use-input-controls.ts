import { useCallback, useMemo, useEffect } from 'react';
import { Track } from 'livekit-client';
import {
  type TrackReferenceOrPlaceholder,
  useLocalParticipant,
  usePersistentUserChoices,
  useTrackToggle,
  useMaybeRoomContext,
} from '@livekit/components-react';

export interface UseInputControlsProps {
  saveUserChoices?: boolean;
  onDisconnect?: () => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

export interface UseInputControlsReturn {
  micTrackRef: TrackReferenceOrPlaceholder;
  microphoneToggle: ReturnType<typeof useTrackToggle<Track.Source.Microphone>>;
  cameraToggle: ReturnType<typeof useTrackToggle<Track.Source.Camera>>;
  screenShareToggle: ReturnType<typeof useTrackToggle<Track.Source.ScreenShare>>;
  handleAudioDeviceChange: (deviceId: string) => void;
  handleVideoDeviceChange: (deviceId: string) => void;
  handleMicrophoneDeviceSelectError: (error: Error) => void;
  handleCameraDeviceSelectError: (error: Error) => void;
}

export function useInputControls({
  saveUserChoices = true,
  onDeviceError,
}: UseInputControlsProps = {}): UseInputControlsReturn {
  const room = useMaybeRoomContext();
  const { microphoneTrack, localParticipant } = useLocalParticipant();
  
  // Debug: Check room availability
  useEffect(() => {
    console.log('[useInputControls] Room context:', {
      hasRoom: !!room,
      roomState: room?.state,
      roomName: room?.name,
      localParticipant: !!localParticipant,
      microphoneTrack: !!microphoneTrack,
    });
  }, [room, localParticipant, microphoneTrack]);

  const microphoneToggle = useTrackToggle({
    source: Track.Source.Microphone,
    onDeviceError: (error) => {
      console.error('[useInputControls] Microphone device error:', error);
      onDeviceError?.({ source: Track.Source.Microphone, error });
    },
  });

  const cameraToggle = useTrackToggle({
    source: Track.Source.Camera,
    onDeviceError: (error) => {
      console.error('[useInputControls] Camera device error:', error);
      onDeviceError?.({ source: Track.Source.Camera, error });
    },
  });

  const screenShareToggle = useTrackToggle({
    source: Track.Source.ScreenShare,
    onDeviceError: (error) => {
      console.error('[useInputControls] ScreenShare device error:', error);
      onDeviceError?.({ source: Track.Source.ScreenShare, error });
    },
  });

  const micTrackRef = useMemo(() => {
    return {
      participant: localParticipant,
      source: Track.Source.Microphone,
      publication: microphoneTrack,
    };
  }, [localParticipant, microphoneTrack]);

  const {
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({ preventSave: !saveUserChoices });

  const handleAudioDeviceChange = useCallback(
    (deviceId: string) => {
      saveAudioInputDeviceId(deviceId ?? 'default');
    },
    [saveAudioInputDeviceId]
  );

  const handleVideoDeviceChange = useCallback(
    (deviceId: string) => {
      saveVideoInputDeviceId(deviceId ?? 'default');
    },
    [saveVideoInputDeviceId]
  );

  const handleToggleCamera = useCallback(
    async (enabled?: boolean) => {
      try {
        console.log('[useInputControls] Toggling camera:', { enabled, currentState: cameraToggle.enabled, pending: cameraToggle.pending });
        if (screenShareToggle.enabled) {
          await screenShareToggle.toggle(false);
        }
        await cameraToggle.toggle(enabled);
        console.log('[useInputControls] Camera toggle completed:', { newState: cameraToggle.enabled });
        // persist video input enabled preference
        saveVideoInputEnabled(!cameraToggle.enabled);
      } catch (error) {
        console.error('[useInputControls] Camera toggle failed:', error);
        onDeviceError?.({ source: Track.Source.Camera, error: error as Error });
      }
    },
    [cameraToggle, screenShareToggle, saveVideoInputEnabled, onDeviceError]
  );

  const handleToggleMicrophone = useCallback(
    async (enabled?: boolean) => {
      try {
        console.log('[useInputControls] Toggling microphone:', { enabled, currentState: microphoneToggle.enabled, pending: microphoneToggle.pending });
        await microphoneToggle.toggle(enabled);
        console.log('[useInputControls] Microphone toggle completed:', { newState: microphoneToggle.enabled });
        // persist audio input enabled preference
        saveAudioInputEnabled(!microphoneToggle.enabled);
      } catch (error) {
        console.error('[useInputControls] Microphone toggle failed:', error);
        onDeviceError?.({ source: Track.Source.Microphone, error: error as Error });
      }
    },
    [microphoneToggle, saveAudioInputEnabled, onDeviceError]
  );

  const handleToggleScreenShare = useCallback(
    async (enabled?: boolean) => {
      try {
        console.log('[useInputControls] Toggling screen share:', { enabled, currentState: screenShareToggle.enabled, pending: screenShareToggle.pending });
        if (cameraToggle.enabled) {
          await cameraToggle.toggle(false);
        }
        await screenShareToggle.toggle(enabled);
        console.log('[useInputControls] Screen share toggle completed:', { newState: screenShareToggle.enabled });
      } catch (error) {
        console.error('[useInputControls] Screen share toggle failed:', error);
        onDeviceError?.({ source: Track.Source.ScreenShare, error: error as Error });
      }
    },
    [cameraToggle, screenShareToggle, onDeviceError]
  );
  const handleMicrophoneDeviceSelectError = useCallback(
    (error: Error) => onDeviceError?.({ source: Track.Source.Microphone, error }),
    [onDeviceError]
  );

  const handleCameraDeviceSelectError = useCallback(
    (error: Error) => onDeviceError?.({ source: Track.Source.Camera, error }),
    [onDeviceError]
  );

  return {
    micTrackRef,
    cameraToggle: {
      ...cameraToggle,
      toggle: handleToggleCamera,
    },
    microphoneToggle: {
      ...microphoneToggle,
      toggle: handleToggleMicrophone,
    },
    screenShareToggle: {
      ...screenShareToggle,
      toggle: handleToggleScreenShare,
    },
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleMicrophoneDeviceSelectError,
    handleCameraDeviceSelectError,
  };
}
