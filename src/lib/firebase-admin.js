import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp = null;

function ensureAdmin() {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApps()[0];
    return adminApp;
  }
  const b64 = process.env.FIREBASE_ADMIN_SA_BASE64;
  if (!b64) {
    throw new Error(
      "FIREBASE_ADMIN_SA_BASE64 is not set. Server-side auth is disabled."
    );
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  } catch {
    throw new Error("FIREBASE_ADMIN_SA_BASE64 is not valid base64-encoded JSON.");
  }
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
  return adminApp;
}

export function adminAuth() {
  return getAuth(ensureAdmin());
}

export function adminDb() {
  return getFirestore(ensureAdmin());
}

export function isAdminConfigured() {
  return Boolean(process.env.FIREBASE_ADMIN_SA_BASE64);
}
