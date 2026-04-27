import "server-only";
import { adminAuth, adminDb, isAdminConfigured } from "./firebase-admin";

/**
 * Extract the bearer Firebase ID token from a Request and verify it.
 * Returns the decoded token (with uid + email) or throws AuthError.
 */
export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function requireUser(req) {
  if (!isAdminConfigured()) {
    throw new AuthError(
      "Server auth is not configured. Set FIREBASE_ADMIN_SA_BASE64.",
      503
    );
  }
  const authHeader = req.headers.get("authorization") || "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new AuthError("Missing bearer token.");
  const token = m[1];
  try {
    const decoded = await adminAuth().verifyIdToken(token, true);
    return decoded; // { uid, email, email_verified, ... }
  } catch (e) {
    throw new AuthError("Invalid or expired token.");
  }
}

/**
 * Look up the user's plan in Firestore: users/{uid}.plan === "premium".
 * Reading the plan from the server prevents a malicious client from
 * pretending to be premium.
 */
export async function getUserPlan(uid) {
  const snap = await adminDb().collection("users").doc(uid).get();
  if (!snap.exists) return "free";
  const data = snap.data() || {};
  return data.plan === "premium" ? "premium" : "free";
}

export async function requirePremium(decodedToken) {
  const plan = await getUserPlan(decodedToken.uid);
  if (plan !== "premium") {
    throw new AuthError("Premium subscription required.", 402);
  }
  return plan;
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin(decodedToken) {
  const email = (decodedToken.email || "").toLowerCase();
  if (email && ADMIN_EMAILS.includes(email)) return true;
  // Also allow Firestore-flagged admins.
  const snap = await adminDb().collection("users").doc(decodedToken.uid).get();
  if (snap.exists && snap.data()?.role === "admin") return true;
  throw new AuthError("Admin access required.", 403);
}

/**
 * Wraps a route handler with consistent error handling and method check.
 * Usage:
 *   export const POST = guarded(async ({ req, user }) => { ... });
 */
export function guarded(handler, { auth = "user" } = {}) {
  return async function (req) {
    try {
      let user = null;
      if (auth !== "none") user = await requireUser(req);
      if (auth === "premium") await requirePremium(user);
      if (auth === "admin") await requireAdmin(user);
      return await handler({ req, user });
    } catch (e) {
      const status = e instanceof AuthError ? e.status : 500;
      const message =
        e instanceof AuthError ? e.message : "Internal server error.";
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "content-type": "application/json" },
      });
    }
  };
}

/**
 * Redact obvious tokens / keys from anything we log.
 */
export function redact(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/(api[-_]?key|token|secret|authorization)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]");
}

export function safeLog(...args) {
  // eslint-disable-next-line no-console
  console.log(...args.map((a) => (typeof a === "string" ? redact(a) : a)));
}
