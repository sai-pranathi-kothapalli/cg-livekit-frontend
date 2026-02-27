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
  companyName: 'Codegnan',
  pageTitle: 'Codegnan - AI Interview Platform',
  pageDescription: 'Codegnan AI Interview Platform - AI-powered mock interviews for technical, HR, and placement preparation.',

  supportsChatInput: true,
  supportsVideoInput: true, // Re-enabled video for avatar support
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  // Logo served from public root; replace this file with the Codegnan logo image
  logo: '/sreedhar-logo.png',
  accent: '#2563eb',
  logoDark: '/sreedhar-logo.png',
  accentDark: '#4f46e5',
  startButtonText: 'Start Interview',

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: 'my-interviewer',
};
