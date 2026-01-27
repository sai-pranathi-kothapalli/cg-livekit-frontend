export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  // for LiveKit Cloud Sandbox
  sandboxId?: string;
  agentName?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Sreedhar CCE',
  pageTitle: 'Sreedhar CCE - Interview Platform',
  pageDescription: 'Interview platform by Sreedhar CCE - Results Super Star',

  supportsChatInput: true,
  supportsVideoInput: true, // Re-enabled video for avatar support
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/sreedhar-logo.png',
  accent: '#002cf2',
  logoDark: '/sreedhar-logo.png',
  accentDark: '#1fd5f9',
  startButtonText: 'Start Interview',

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: 'my-interviewer',
};
