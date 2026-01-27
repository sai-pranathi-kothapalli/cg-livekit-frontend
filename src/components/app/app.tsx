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

const IN_DEVELOPMENT = import.meta.env.DEV;

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
  interviewToken?: string;
}

export function App({ appConfig, interviewToken }: AppProps) {
  const tokenSource = useMemo(() => {
    if (import.meta.env.VITE_CONN_DETAILS_ENDPOINT) {
      return getSandboxTokenSource(appConfig);
    }

    // Create custom token source that calls backend API
    const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';

    if (interviewToken) {
      return TokenSource.custom(async () => {
        const requestBody = {
          room_config: appConfig.agentName
            ? { agents: [{ agent_name: appConfig.agentName }] }
            : undefined,
          token: interviewToken,
        };
        console.log('[Frontend] 📤 Requesting connection details:', {
          url: `${API_BASE_URL}/api/connection-details`,
          agentName: appConfig.agentName,
          requestBody,
        });
        const res = await fetch(`${API_BASE_URL}/api/connection-details`, {
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
        
        // Map backend's participantToken to expected 'token' key
        return {
          ...response,
          token: response.participantToken,
        };
      });
    }

    // Default: call backend API endpoint
    return TokenSource.custom(async () => {
      const requestBody = {
        room_config: appConfig.agentName
          ? { agents: [{ agent_name: appConfig.agentName }] }
          : undefined,
      };
      console.log('[Frontend] 📤 Requesting connection details (no token):', {
        url: `${API_BASE_URL}/api/connection-details`,
        agentName: appConfig.agentName,
        requestBody,
      });
      const res = await fetch(`${API_BASE_URL}/api/connection-details`, {
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
      
      // Map backend's participantToken to expected 'token' key
      return {
        ...response,
        token: response.participantToken,
      };
    });
  }, [appConfig, interviewToken]);

  const session = useSession(
    tokenSource,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  return (
    <SessionProvider session={session}>
      <AppSetup />
      <main className="grid h-svh grid-cols-1 place-content-center">
        <ViewController appConfig={appConfig} />
      </main>
      <StartAudio label="Start Audio" />
      <RoomAudioRenderer />
      <Toaster />
    </SessionProvider>
  );
}
