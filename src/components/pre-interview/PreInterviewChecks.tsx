'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Camera,
    Microphone,
    Monitor,
    WifiHigh,
    SpeakerHigh,
    CheckCircle,
    XCircle,
    CircleNotch,
    Warning,
    Play
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { debug } from '@/lib/debug';

type CheckStatus = 'idle' | 'loading' | 'success' | 'failure' | 'warning';

interface CheckItemProps {
    id: string;
    icon: React.ElementType;
    label: string;
    status: CheckStatus;
    description?: string;
    value?: string;
}

const CheckItem = ({ icon: Icon, label, status, description, value }: CheckItemProps) => {
    const getStatusIcon = () => {
        switch (status) {
            case 'loading':
                return <CircleNotch className="h-5 w-5 animate-spin text-blue-400" />;
            case 'success':
                return <CheckCircle weight="fill" className="h-6 w-6 text-green-500" />;
            case 'failure':
                return <XCircle weight="fill" className="h-6 w-6 text-red-500" />;
            case 'warning':
                return <Warning weight="fill" className="h-6 w-6 text-yellow-500" />;
            default:
                return <div className="h-6 w-6 rounded-full border-2 border-slate-700" />;
        }
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm transition-all hover:bg-slate-800/60">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "p-2.5 rounded-lg",
                    status === 'success' ? "bg-green-500/10 text-green-400" :
                        status === 'failure' ? "bg-red-500/10 text-red-400" :
                            "bg-slate-700/50 text-slate-300"
                )}>
                    <Icon size={24} weight="bold" />
                </div>
                <div>
                    <p className="font-semibold text-slate-100">{label}</p>
                    {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-3">
                {value && <span className="text-sm font-mono text-slate-300 bg-slate-700/50 px-2 py-0.5 rounded">{value}</span>}
                {getStatusIcon()}
            </div>
        </div>
    );
};

interface PreInterviewChecksProps {
    onAllChecksPassed: () => void;
    userName?: string;
}

export function PreInterviewChecks({ onAllChecksPassed, userName = "Candidate" }: PreInterviewChecksProps) {
    const [cameraStatus, setCameraStatus] = useState<CheckStatus>('idle');
    const [micStatus, setMicStatus] = useState<CheckStatus>('idle');
    const [screenShareStatus, setScreenShareStatus] = useState<CheckStatus>('idle');
    const [speedStatus, setSpeedStatus] = useState<CheckStatus>('idle');
    const [audioOutputStatus, setAudioOutputStatus] = useState<CheckStatus>('idle');

    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [micLevel, setMicLevel] = useState(0);
    const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const speedTestAsset = '/sreedhar-logo.png'; // ~75KB

    // 1. Camera Check
    const checkCamera = async () => {
        setCameraStatus('loading');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            debug.error('MediaDevices API not available (Non-secure context?)');
            setCameraStatus('failure');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraStatus('success');
        } catch (err) {
            debug.error('Camera access denied:', err);
            setCameraStatus('failure');
        }
    };

    // 2. Microphone Check
    const checkMic = async () => {
        setMicStatus('loading');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setMicStatus('failure');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;

            audioCtxRef.current = audioCtx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                setMicLevel(average);
                if (average > 5) setMicStatus('success'); // High enough to detect sound
                requestAnimationFrame(updateLevel);
            };
            updateLevel();
        } catch (err) {
            debug.error('Mic access denied:', err);
            setMicStatus('failure');
        }
    };

    // 3. Screen Share Check
    const checkScreenShare = () => {
        setScreenShareStatus('loading');
        if (navigator.mediaDevices && !!navigator.mediaDevices.getDisplayMedia) {
            setScreenShareStatus('success');
        } else {
            setScreenShareStatus('failure');
        }
    };

    // 4. Internet Speed Check
    const checkSpeed = async () => {
        setSpeedStatus('loading');
        const startTime = performance.now();
        try {
            const response = await fetch(`${speedTestAsset}?t=${Date.now()}`); // Cache busting
            const blob = await response.blob();
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000; // seconds
            const bitsLoaded = blob.size * 8;
            const speedMbps = (bitsLoaded / duration) / 1000000;

            setDownloadSpeed(speedMbps);
            if (speedMbps > 2) setSpeedStatus('success');
            else setSpeedStatus('warning'); // Always allow as warning at minimum
        } catch (err) {
            setSpeedStatus('warning'); // Even error is a warning now
        }
    };

    // 5. Audio Output Check
    const playTestSound = () => {
        setAudioOutputStatus('loading');
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = 440; // A4 beep
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);

        osc.start();
        osc.stop(ctx.currentTime + 1);
    };

    const confirmAudioOutput = (heard: boolean) => {
        setAudioOutputStatus(heard ? 'success' : 'failure');
    };

    // Run initial checks (except manual ones)
    useEffect(() => {
        checkCamera();
        checkMic();
        checkScreenShare();
        checkSpeed();

        return () => {
            if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
            if (audioCtxRef.current) audioCtxRef.current.close();
        };
    }, []);

    const allPassed =
        cameraStatus === 'success' &&
        micStatus === 'success' &&
        screenShareStatus === 'success' &&
        (speedStatus === 'success' || speedStatus === 'warning') &&
        audioOutputStatus === 'success';

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
            >
                {/* Left Side: Preview & Branding */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Ready to start, {userName}?
                        </h1>
                        <p className="text-slate-400">
                            Let's make sure everything is working perfectly for your interview.
                        </p>
                    </div>

                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl group">
                        {cameraStream ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover mirror"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500">
                                <Camera size={64} weight="thin" />
                                <p className="text-sm">Camera preview will appear here</p>
                            </div>
                        )}

                        {/* Mic Meter Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-black/40 rounded-full overflow-hidden backdrop-blur-md">
                            <motion.div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, micLevel * 2)}%` }}
                            />
                        </div>

                        <div className="absolute top-4 left-4 flex gap-2">
                            <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold tracking-widest uppercase border border-white/10">
                                Live Preview
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-xs text-slate-400 leading-relaxed italic">
                        Tips: Find a quiet place with good lighting. Ensure your face is centered in the camera frame.
                    </div>
                </div>

                {/* Right Side: Checklist */}
                <div className="space-y-6">
                    <div className="grid gap-3">
                        <CheckItem
                            id="camera"
                            icon={Camera}
                            label="Camera Access"
                            status={cameraStatus}
                            description={cameraStatus === 'failure' ? 'Please allow camera access in browser' : 'Permission for video feed'}
                        />
                        <CheckItem
                            id="mic"
                            icon={Microphone}
                            label="Microphone Access"
                            status={micStatus}
                            description={micStatus === 'failure' ? 'Please allow mic access in browser' : 'Detecting your voice'}
                        />
                        <CheckItem
                            id="screen"
                            icon={Monitor}
                            label="Screen Sharing"
                            status={screenShareStatus}
                            description="Browser support for screen share"
                        />
                        <CheckItem
                            id="speed"
                            icon={WifiHigh}
                            label="Internet Connection"
                            status={speedStatus}
                            value={downloadSpeed ? `${downloadSpeed.toFixed(1)} Mbps` : undefined}
                            description={downloadSpeed !== null && downloadSpeed < 1
                                ? `Your connection: ${downloadSpeed.toFixed(1)} Mbps (Minimum recommended: 1 Mbps)`
                                : 'Stability for video call'}
                        />

                        {/* Audio Output Step */}
                        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2.5 rounded-lg",
                                        audioOutputStatus === 'success' ? "bg-green-500/10 text-green-400" : "bg-slate-700/50 text-slate-300"
                                    )}>
                                        <SpeakerHigh size={24} weight="bold" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-100">Audio Output</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Can you hear the test sound?</p>
                                    </div>
                                </div>
                                {audioOutputStatus === 'success' ? (
                                    <CheckCircle weight="fill" className="h-6 w-6 text-green-500" />
                                ) : (
                                    <button
                                        onClick={playTestSound}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all"
                                    >
                                        <Play size={12} weight="fill" /> TEST
                                    </button>
                                )}
                            </div>

                            {audioOutputStatus === 'loading' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between"
                                >
                                    <p className="text-xs text-slate-300">Did you hear the beep?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => confirmAudioOutput(false)}
                                            className="px-3 py-1 rounded-md bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-xs transition-all"
                                        >
                                            No
                                        </button>
                                        <button
                                            onClick={() => confirmAudioOutput(true)}
                                            className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-all"
                                        >
                                            Yes
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button
                            disabled={!allPassed}
                            onClick={onAllChecksPassed}
                            className={cn(
                                "w-full py-4 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2",
                                allPassed
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/20 scale-[1.02]"
                                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                            )}
                        >
                            Start Interview
                            {allPassed && <CheckCircle weight="bold" size={24} />}
                        </button>

                        {!allPassed && (
                            <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                Complete all checks to proceed
                            </p>
                        )}
                    </div>

                    {/* Troubleshooting Section */}
                    {(cameraStatus === 'failure' || micStatus === 'failure' || speedStatus === 'failure') && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-2"
                        >
                            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                                <Warning size={14} weight="bold" /> Troubleshooting Tips
                            </div>
                            <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                                {(!navigator.mediaDevices || !window.isSecureContext) && (
                                    <li className="text-red-300 font-semibold">Security Error: Browsers only allow camera/mic access over HTTPS or localhost. If you are using a network URL (like 192.168...), you MUST use an HTTPS tunnel.</li>
                                )}
                                {cameraStatus === 'failure' && <li>Ensure your camera isn't used by another app (Zoom, Teams).</li>}
                                {micStatus === 'failure' && <li>Check if your microphone is physically muted.</li>}
                                {speedStatus === 'failure' && <li>Try moving closer to your router or switching to a stable network.</li>}
                                <li>Click the lock icon in the address bar to reset permissions.</li>
                            </ul>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
        </div>
    );
}
