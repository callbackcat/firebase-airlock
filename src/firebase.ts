import { initializeApp, type FirebaseApp } from 'firebase/app';
import { CustomProvider, initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAI, GoogleAIBackend, type AI } from 'firebase/ai';

/**
 * Config comes from .env.local (see env.example), never from the repo.
 * Returns null when it is missing so the UI can still show the pattern-only
 * scrub without a Firebase project.
 */
export function initFirebase(): AI | null {
  const raw = import.meta.env.VITE_FIREBASE_CONFIG as string | undefined;
  if (!raw) return null;

  const app: FirebaseApp = initializeApp(JSON.parse(raw));
  const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string | undefined;

  // Firebase AI Logic requires App Check.
  //
  // Dev: the debug provider. Put a UUID you registered in the Firebase console
  // in VITE_APPCHECK_DEBUG_TOKEN so every browser profile (including an
  // automated one) presents the same token. Leave it unset and the SDK prints
  // a fresh token to the console for you to register.
  //
  // Production builds never enable debug mode and need a real site key.
  if (import.meta.env.DEV) {
    const fixed = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined;
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      fixed || true;
  }

  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } else if (import.meta.env.DEV) {
    // In debug mode the SDK exchanges the debug token and never asks the
    // provider, so a placeholder provider is enough for local work.
    initializeAppCheck(app, {
      provider: new CustomProvider({
        getToken: () => Promise.reject(new Error('No App Check provider configured outside debug mode.')),
      }),
      isTokenAutoRefreshEnabled: true,
    });
  } else {
    console.warn('No App Check site key: Firebase AI Logic calls will be rejected.');
  }

  return getAI(app, { backend: new GoogleAIBackend() });
}
