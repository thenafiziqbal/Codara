"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase web API keys are public-by-design (they identify the project,
// not authorize it). Real security comes from Firestore rules + Firebase
// Auth — see firestore.rules. Env vars override the defaults so each
// deployment can point at a different project.
const DEFAULTS = {
  apiKey: "AIzaSyDN7SB77akt3hVTbXEGbLSFnufDgfKhIi4",
  authDomain: "edu1-4a91f.firebaseapp.com",
  projectId: "edu1-4a91f",
  storageBucket: "edu1-4a91f.appspot.com",
  messagingSenderId: "99164691896",
  appId: "1:99164691896:web:23973a25f587a43be8834d",
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULTS.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULTS.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULTS.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULTS.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULTS.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || DEFAULTS.appId,
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const firebaseApp = isConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const firebaseConfigured = isConfigured;
