/**
 * useAudioAnalyser
 *
 * Extracts real-time audio data from a LiveKit TrackReference (the agent's
 * audio track) by creating a Web Audio API AnalyserNode.
 *
 * Returns a ref to the AnalyserNode so that the R3F render loop can read
 * frequency/time-domain data every frame without triggering React re-renders.
 *
 * IMPORTANT: This hook does NOT connect the analyser to the audio destination.
 * Audio playback is already handled by LiveKit's <RoomAudioRenderer />.
 */

import { useEffect, useRef } from 'react';
import type { TrackReference } from '@livekit/components-react';

export interface AudioAnalyserRefs {
  /** Reference to the Web Audio AnalyserNode (null until track connects) */
  analyserNode: React.MutableRefObject<AnalyserNode | null>;
  /** Pre-allocated Uint8Array for time-domain data (avoids GC in render loop) */
  dataArray: React.MutableRefObject<Uint8Array | null>;
}

/**
 * Creates an AudioContext and AnalyserNode connected to the given LiveKit
 * audio track. Returns refs that can be read inside a useFrame() callback
 * without causing React re-renders.
 *
 * @param trackRef - The agent's audio TrackReference from useVoiceAssistant()
 */
export function useAudioAnalyser(
  trackRef: TrackReference | undefined,
): AudioAnalyserRefs {
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Internal refs for cleanup
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    console.log('[useAudioAnalyser] 🔄 useEffect triggered', {
      hasTrackRef: !!trackRef,
      trackSid: trackRef?.publication?.trackSid,
      hasTrack: !!trackRef?.publication?.track
    });

    // Clean up previous connection
    cleanup();
    if (!trackRef) return;

    // Access the underlying MediaStreamTrack from the LiveKit publication
    const publication = trackRef.publication;
    const track = publication?.track;

    if (!track) {
      console.warn('[useAudioAnalyser] ⚠️ No track found on publication');
      return;
    }

    // The LiveKit track object exposes .mediaStreamTrack
    const mediaStreamTrack = (track as any).mediaStreamTrack as
      | MediaStreamTrack
      | undefined;

    console.log('[useAudioAnalyser] 🎙️ Audio Track Found:', {
      identity: trackRef.participant.identity,
      trackSid: publication?.trackSid,
      kind: track.kind,
      isRemote: true,
      readyState: mediaStreamTrack?.readyState,
      enabled: mediaStreamTrack?.enabled,
      muted: track.isMuted,
    });

    if (!mediaStreamTrack || mediaStreamTrack.readyState !== 'live') {
      console.warn('[useAudioAnalyser] ❌ MediaStreamTrack is NOT live or missing');
      return;
    }

    try {
      // Create AudioContext
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      console.log('[useAudioAnalyser] 📻 AudioContext created. Current state:', audioCtx.state);

      // Listen for state changes (e.g. suspended by autoplay)
      audioCtx.onstatechange = () => {
        console.log('[useAudioAnalyser] 📻 AudioContext state changed:', audioCtx.state);
      };

      // Auto-resume on user interaction (aggressive fix for browser autoplay blocks)
      const resumeOnInteraction = () => {
        if (audioCtx.state === 'suspended') {
          console.log('[useAudioAnalyser] 👆 User interaction detected, resuming AudioContext...');
          audioCtx.resume();
        }
      };
      window.addEventListener('click', resumeOnInteraction);
      window.addEventListener('touchstart', resumeOnInteraction);

      // Wrap the MediaStreamTrack in a MediaStream
      const stream = new MediaStream([mediaStreamTrack]);

      // Create source from the stream
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      console.log('[useAudioAnalyser] 🔗 MediaStreamSource created from track');

      // Create AnalyserNode with settings optimized for lip-sync
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      // Connect: source -> analyser (NOT to destination!)
      source.connect(analyser);

      // Store refs
      analyserNodeRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.fftSize);
      console.log('[useAudioAnalyser] ✅ Analyser connected');

      // Initial resume attempt
      if (audioCtx.state === 'suspended') {
        audioCtx.resume()
          .then(() => console.log('[useAudioAnalyser] 📻 Initial resume successful'))
          .catch((err) => console.warn('[useAudioAnalyser] 📻 Initial resume failed (expected):', err));
      }

      return () => {
        window.removeEventListener('click', resumeOnInteraction);
        window.removeEventListener('touchstart', resumeOnInteraction);
        cleanup();
      };
    } catch (err) {
      console.warn('[useAudioAnalyser] ❌ Failed to create audio analyser:', err);
      cleanup();
    }
  }, [
    // Re-run when the track's SID changes or the track object itself changes/attaches
    trackRef?.publication?.trackSid,
    trackRef?.publication?.track,
  ]);

  function cleanup() {
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // Already disconnected
      }
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // Already closed
      }
      audioCtxRef.current = null;
    }
    analyserNodeRef.current = null;
    dataArrayRef.current = null;
  }

  return {
    analyserNode: analyserNodeRef,
    dataArray: dataArrayRef,
  };
}
