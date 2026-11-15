import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAI, GoogleAIBackend, type AI } from 'firebase/ai';

/**
 * Config comes from .env.local (see .env.example), never from the repo.
 * Returns null when it is missing so the UI can still show the regex-only
 * scrub without a Firebase project.
 */
export function initFirebase(): AI | null {
  const raw = import.meta.env.VITE_FIREBASE_CONFIG as string | undefined;
  if (!raw) return null;

  const app: FirebaseApp = initializeApp(JSON.parse(raw));

  // Firebase AI Logic requires App Check. In dev, the debug provider prints a
  // token to the console; register it under App Check > Manage debug tokens.
  if (import.meta.env.DEV) {
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string | undefined;
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }

  return getAI(app, { backend: new GoogleAIBackend() });
}
