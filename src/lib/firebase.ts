import { initializeApp } from 'firebase/app'; import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'; import { env, firebaseReady } from './env';
export const auth=firebaseReady?getAuth(initializeApp({apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID,appId:env.VITE_FIREBASE_APP_ID})):null;
if(auth) void setPersistence(auth,browserLocalPersistence);
