/**
 * Build-time environment configuration (Vite inlines VITE_* values).
 * Mirrors the old Flutter `Env` class + `--dart-define-from-file`.
 */
export const Env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL ?? '',
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID ?? '',
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  measurementId: import.meta.env.VITE_MEASUREMENT_ID ?? '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
} as const;

/** True once the essential values are present. Used to surface a clear
 *  configuration error instead of confusing network/auth failures. */
export function isEnvConfigured(): boolean {
  return (
    !!Env.apiBaseUrl &&
    !Env.apiBaseUrl.includes('YOUR_') &&
    !!Env.firebaseApiKey &&
    !Env.firebaseApiKey.includes('YOUR_')
  );
}

/** REST endpoint paths — 1:1 with the old ApiConstants. */
export const Api = {
  login: '/auth/login',
  register: '/auth/register',
  googleLogin: '/auth/google',
  authSync: '/auth/sync',
  authProfile: '/auth/profile',
  updateFcmToken: '/auth/fcm-token',

  interviewInit: '/interview/init',
  interviewTerminate: '/interview/terminate',

  resumeValidateHash: '/resume/validate-hash',
  resumeUploadUrl: '/resume/upload-url',
  resumeList: '/resume/list',
  resumeDetail: '/resume/detail',
  resumeProcess: '/resume/process',
  resumeSetActive: '/resume/active',

  scraperFetch: '/scraper/fetch',
  websiteValidate: '/website/validate',
  jdAnalyze: '/jd/analyze',
  jdUploadUrl: '/jd/upload-url',

  dashboardSummary: '/dashboard/summary',
  dashboardStats: '/dashboard/stats',
  feedbackReport: '/dashboard/session',
  sessionHistory: '/session/history',
} as const;

/** App-wide constants (mirrors AppConstants). */
export const AppConstants = {
  maxResumeFileSize: 5_242_880, // 5 MB
  allowedResumeExtensions: ['pdf', 'doc', 'docx'] as const,
  maxSilenceStrikes: 3,
};
