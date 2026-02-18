import { useMemo } from 'react';
import { TokenSource } from 'livekit-client';
import {
  RoomAudioRenderer,
  SessionProvider,
  StartAudio,
  useSession,
} from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/livekit/toaster';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource } from '@/lib/utils';
import { debug } from '@/lib/debug';

const IN_DEVELOPMENT = import.meta.env.DEV;

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
  interviewToken?: string;
  interviewDuration?: number;
  scheduledAt?: string;
}

export function App({ appConfig, interviewToken, interviewDuration, scheduledAt }: AppProps) {
  const tokenSource = useMemo(() => {
    if (import.meta.env.VITE_CONN_DETAILS_ENDPOINT) {
      return getSandboxTokenSource(appConfig);
    }

    // Create custom token source that calls backend API
    const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';

    if (interviewToken) {
      return TokenSource.custom(async () => {
        const requestBody = {
          token: interviewToken,
        };
        console.log('[Frontend] 📤 Requesting connection details:', {
          url: `${API_BASE_URL}/api/interviews/connection-details`,
          agentName: appConfig.agentName,
          requestBody,
        });
        // Include auth token in headers if available
        const authToken = localStorage.getItem('authToken');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch(`${API_BASE_URL}/api/interviews/connection-details`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({ detail: `HTTP ${res.status}: ${res.statusText}` }));
          debug.error('[Frontend] ❌ Connection details request failed:', error);
          throw new Error(error.detail || `Failed to get connection details: ${res.statusText}`);
        }
        const response = await res.json();
        console.log('[Frontend] ✅ Received connection details:', {
          serverUrl: response.serverUrl,
          roomName: response.roomName,
          participantName: response.participantName,
        });

        const connectionDetails = {
          ...response,
          url: response.serverUrl,
          token: response.participantToken,
        };

        console.log('[Frontend] 🚀 Connecting to LiveKit with:', {
          url: connectionDetails.url,
          room: connectionDetails.roomName,
          participant: connectionDetails.participantName,
        });

        return connectionDetails;
      });
    }

    console.log('[Frontend] 🔄 Creating tokenSource', { interviewToken, agentName: appConfig.agentName });
    // Default: call backend API endpoint
    return TokenSource.custom(async () => {
      const requestBody = {
        token: appConfig.agentName ? "" : undefined, // Maintain structure if needed, or just {}
      };
      console.log('[Frontend] 📤 Requesting connection details (no token):', {
        url: `${API_BASE_URL}/api/interviews/connection-details`,
        agentName: appConfig.agentName,
        requestBody,
      });
      const res = await fetch(`${API_BASE_URL}/api/interviews/connection-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: `HTTP ${res.status}: ${res.statusText}` }));
        console.error('[Frontend] ❌ Connection details request failed:', error);
        throw new Error(error.detail || `Failed to get connection details: ${res.statusText}`);
      }
      const response = await res.json();
      console.log('[Frontend] ✅ Received connection details:', {
        serverUrl: response.serverUrl,
        roomName: response.roomName,
        participantName: response.participantName,
      });

      const connectionDetails = {
        ...response,
        url: response.serverUrl,
        token: response.participantToken,
      };

      console.log('[Frontend] 🚀 Connecting to LiveKit with:', {
        url: connectionDetails.url,
        room: connectionDetails.roomName,
        participant: connectionDetails.participantName,
      });

      return connectionDetails;
    });
  }, [appConfig, interviewToken]);

  const session = useSession(tokenSource);

  return (
    <SessionProvider session={session}>
      <AppSetup />
      <main className="grid h-svh grid-cols-1 place-content-center">
        <ViewController
          appConfig={appConfig}
          interviewToken={interviewToken}
          interviewDuration={interviewDuration}
          scheduledAt={scheduledAt}
        />
      </main>
      <StartAudio label="Start Audio" />
      <RoomAudioRenderer />
      <Toaster />
    </SessionProvider>
  );
}
