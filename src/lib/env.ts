import { z } from 'zod';

const emptyToUndefined = (value: unknown) => value === '' ? undefined : value;
const booleanFlag = z.preprocess(emptyToUndefined, z.enum(['true','false']).default('false'));

const schema = z.object({
  VITE_API_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().default('https://astromatch-api-k996.onrender.com')),
  VITE_FIREBASE_API_KEY: z.preprocess(emptyToUndefined, z.string().default('AIzaSyDNIwjVMF1cwR8yVOlOT4aucXtOlhhUzzk')),
  VITE_FIREBASE_AUTH_DOMAIN: z.preprocess(emptyToUndefined, z.string().default('astromatch-abaa9.firebaseapp.com')),
  VITE_FIREBASE_PROJECT_ID: z.preprocess(emptyToUndefined, z.string().default('astromatch-abaa9')),
  VITE_FIREBASE_STORAGE_BUCKET: z.preprocess(emptyToUndefined, z.string().default('astromatch-abaa9.firebasestorage.app')),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.preprocess(emptyToUndefined, z.string().default('965474299563')),
  VITE_FIREBASE_APP_ID: z.preprocess(emptyToUndefined, z.string().default('1:965474299563:web:5edb56093cec52e0db51ee')),
  VITE_GA4_MEASUREMENT_ID: z.preprocess(emptyToUndefined, z.string().default('G-CCL3WV8E5Z')),
  VITE_ENVIRONMENT: z.preprocess(emptyToUndefined, z.string().default('development')),
  VITE_ENABLE_ANALYTICS: booleanFlag,
  VITE_ENABLE_DEV_FIXTURES: booleanFlag,
});
export const parseEnvironment = (values: Record<string, unknown>) => schema.parse(values);
export const env=parseEnvironment(import.meta.env);
export const firebaseReady=Boolean(env.VITE_FIREBASE_API_KEY&&env.VITE_FIREBASE_AUTH_DOMAIN&&env.VITE_FIREBASE_PROJECT_ID&&env.VITE_FIREBASE_APP_ID);
