/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_CONN_DETAILS_ENDPOINT?: string;
  readonly VITE_APP_CONFIG_ENDPOINT?: string;
  readonly VITE_SANDBOX_ID?: string;
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
