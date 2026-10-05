// All AWS identifiers come from Vite environment variables (never hardcoded).
const env = import.meta.env;

export const config = {
  region: env.VITE_AWS_REGION?.trim() || '',
  userPoolId: env.VITE_COGNITO_USER_POOL_ID?.trim() || '',
  clientId: env.VITE_COGNITO_CLIENT_ID?.trim() || '',
  apiUrl: (env.VITE_API_URL?.trim() || '').replace(/\/+$/, ''),
};

// Demo mode: when AWS is not configured, the app runs fully in the browser
// using the same backend route logic with localStorage/IndexedDB storage.
export const isDemoMode = !(config.region && config.userPoolId && config.clientId && config.apiUrl);
