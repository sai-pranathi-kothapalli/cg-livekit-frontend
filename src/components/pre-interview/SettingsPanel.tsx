'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Microphone,
  SpeakerHigh,
  WifiHigh,
  CaretDown,
  CaretUp,
  CheckCircle,
  X,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface DeviceInfo {
  id: string;
  label: string;
  kind: string;
  status: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

export function SettingsPanel({ open, onClose, className }: SettingsPanelProps) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // Device list (requires permission to get labels)
        if (navigator.mediaDevices?.enumerateDevices) {
          const list = await navigator.mediaDevices.enumerateDevices();
          const items: DeviceInfo[] = list.map((d) => ({
            id: d.deviceId,
            label: d.label || `${d.kind} (${d.deviceId.slice(0, 8)}...)`,
            kind: d.kind,
            status: 'unknown',
          }));
          if (!cancelled) setDevices(items);
        }

        // Network (Network Information API - not in all browsers)
        const nav = navigator as Navigator & { connection?: NetworkInformation };
        if (nav.connection) {
          const conn = nav.connection;
          setNetwork({
            effectiveType: conn.effectiveType,
            downlink: conn.downlink,
            rtt: conn.rtt,
            saveData: conn.saveData,
            type: conn.type,
          });
        } else {
          setNetwork({ effectiveType: 'unknown' });
        }
      } catch (e) {
        if (!cancelled) setDevices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const cameras = devices.filter((d) => d.kind === 'videoinput');
  const mics = devices.filter((d) => d.kind === 'audioinput');
  const speakers = devices.filter((d) => d.kind === 'audiooutput');

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
        className
      )}
      onClick={onClose}
      role="dialog"
      aria-label="Settings"
    >
      <div
        className="bg-slate-900 dark:bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Device &amp; Network</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded"
            aria-label="Close"
          >
            <X size={24} weight="bold" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-4">
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : (
            <>
              {/* Cameras */}
              <Section
                icon={Camera}
                title="Cameras"
                items={cameras}
                emptyLabel="No cameras found"
              />
              {/* Microphones */}
              <Section
                icon={Microphone}
                title="Microphones"
                items={mics}
                emptyLabel="No microphones found"
              />
              {/* Speakers */}
              <Section
                icon={SpeakerHigh}
                title="Speakers"
                items={speakers}
                emptyLabel="No speakers found"
              />
              {/* Network */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <WifiHigh size={24} weight="bold" className="text-slate-300" />
                  <span className="font-semibold text-slate-100">Network</span>
                </div>
                {network ? (
                  <ul className="text-sm text-slate-400 space-y-1">
                    {network.effectiveType && (
                      <li>Type: <span className="text-slate-200">{network.effectiveType}</span></li>
                    )}
                    {network.downlink != null && (
                      <li>Downlink: <span className="text-slate-200">{network.downlink} Mbps</span></li>
                    )}
                    {network.rtt != null && (
                      <li>RTT: <span className="text-slate-200">{network.rtt} ms</span></li>
                    )}
                    {network.saveData != null && (
                      <li>Data saver: <span className="text-slate-200">{network.saveData ? 'On' : 'Off'}</span></li>
                    )}
                    {(!network.effectiveType && !network.downlink) && (
                      <li className="text-slate-500">Network info not available in this browser.</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">Network info not available.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
}

function Section({
  icon: Icon,
  title,
  items,
  emptyLabel,
}: {
  icon: React.ElementType;
  title: string;
  items: DeviceInfo[];
  emptyLabel: string;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
      <button
        type="button"
        className="w-full p-4 flex items-center justify-between text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <Icon size={22} weight="bold" className="text-slate-300" />
          <span className="font-semibold text-slate-100">{title}</span>
          <span className="text-xs text-slate-500">({items.length})</span>
        </div>
        {expanded ? <CaretDown size={18} className="text-slate-400" /> : <CaretUp size={18} className="text-slate-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-1">
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">{emptyLabel}</p>
          ) : (
            items.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 py-1.5 text-sm text-slate-300 truncate"
                title={d.label}
              >
                <CheckCircle size={14} weight="fill" className="text-green-500/80 shrink-0" />
                <span className="truncate">{d.label}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
