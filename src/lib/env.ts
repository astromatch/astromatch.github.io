import { z } from 'zod';

const emptyToUndefined = (value: unknown) => value === '' ? undefined : value;
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const booleanFlag = z.preprocess(emptyToUndefined, z.enum(['true','false']).default('false'));

const schema = z.object({
  VITE_API_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().default('https://api.astromatch.world')),
  VITE_FIREBASE_API_KEY: optionalString,
  VITE_FIREBASE_AUTH_DOMAIN: optionalString,
  VITE_FIREBASE_PROJECT_ID: optionalString,
  VITE_FIREBASE_APP_ID: optionalString,
  VITE_GA4_MEASUREMENT_ID: optionalString,
  VITE_ENVIRONMENT: z.preprocess(emptyToUndefined, z.string().default('development')),
  VITE_ENABLE_ANALYTICS: booleanFlag,
  VITE_ENABLE_DEV_FIXTURES: booleanFlag,
});
export const parseEnvironment = (values: Record<string, unknown>) => schema.parse(values);
export const env=parseEnvironment(import.meta.env); export const firebaseReady=Boolean(env.VITE_FIREBASE_API_KEY&&env.VITE_FIREBASE_AUTH_DOMAIN&&env.VITE_FIREBASE_PROJECT_ID&&env.VITE_FIREBASE_APP_ID);
