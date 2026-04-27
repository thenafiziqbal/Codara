"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase";

const AuthContext = createContext({
  user: null,
  loading: true,
  configured: false,
  plan: "free",
  refreshPlan: async () => {},
  signInEmail: async () => {},
  signUpEmail: async () => {},
  signInGoogle: async () => {},
  logout: async () => {},
  authedFetch: async () => null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const authedFetch = useCallback(
    async (input, init = {}) => {
      const headers = new Headers(init.headers || {});
      if (user) {
        const token = await user.getIdToken();
        headers.set("authorization", `Bearer ${token}`);
      }
      if (init.body && !headers.has("content-type") && !(init.body instanceof FormData)) {
        headers.set("content-type", "application/json");
      }
      return fetch(input, { ...init, headers });
    },
    [user]
  );

  const refreshPlan = useCallback(async () => {
    if (!user) {
      setPlan("free");
      return;
    }
    try {
      const res = await authedFetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan === "premium" ? "premium" : "free");
      }
    } catch {
      // ignore
    }
  }, [user, authedFetch]);

  useEffect(() => {
    refreshPlan();
  }, [refreshPlan]);

  const signInEmail = useCallback(async (email, password) => {
    if (!auth) throw new Error("Firebase not configured.");
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpEmail = useCallback(async (email, password) => {
    if (!auth) throw new Error("Firebase not configured.");
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const signInGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase not configured.");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured: firebaseConfigured,
        plan,
        refreshPlan,
        signInEmail,
        signUpEmail,
        signInGoogle,
        logout,
        authedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
