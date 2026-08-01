"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? "https://stranger-connect-4s2z.onrender.com"
    : "http://localhost:5001";

const STORAGE_KEY = "anon_token";

type AnonUser = {
  userId: string;
  token: string;
  displayName: string;
  avatarUrl: string;
  gender: string | null;
  isPremium: boolean;
};

type AnonymousAuthContextType = {
  anonUser: AnonUser | null;
  isAnonLoading: boolean;
  loginAsGuest: () => Promise<void>;
  regenerateIdentity: () => Promise<void>;
  logoutGuest: () => void;
};

const AnonymousAuthContext =
  createContext<AnonymousAuthContextType | null>(null);

export function AnonymousAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [anonUser, setAnonUser] = useState<AnonUser | null>(null);
  const [isAnonLoading, setIsAnonLoading] = useState(true);

  // On first load, silently resume a previous guest session if the
  // browser already has a token — so returning guests don't have to
  // click "Continue as Guest" again
  useEffect(() => {
    const existingToken = localStorage.getItem(STORAGE_KEY);

    if (!existingToken) {
      setIsAnonLoading(false);
      return;
    }

    fetch(`${SOCKET_URL}/api/auth/anonymous`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: existingToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem(STORAGE_KEY, data.token);
        setAnonUser(data);
      })
      .catch((error) => {
        console.error("RESUME GUEST SESSION FAILED:", error);
      })
      .finally(() => {
        setIsAnonLoading(false);
      });
  }, []);

  const loginAsGuest = useCallback(async () => {
    setIsAnonLoading(true);

    try {
      const existingToken = localStorage.getItem(STORAGE_KEY);

      // Render's free tier sleeps when idle and can take 20-50s to
      // cold-start on the first request after a while — give it real
      // room, but don't let the UI hang forever if it's genuinely down
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(`${SOCKET_URL}/api/auth/anonymous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: existingToken || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Guest auth responded with ${res.status}`);
      }

      const data = await res.json();

      localStorage.setItem(STORAGE_KEY, data.token);
      setAnonUser(data);
    } catch (error) {
      console.error("GUEST LOGIN FAILED:", error);
      // Re-throw so the caller knows this failed and doesn't treat it
      // as a success (e.g. navigating to /chat with no identity set)
      throw error;
    } finally {
      setIsAnonLoading(false);
    }
  }, []);

  const regenerateIdentity = useCallback(async () => {
    const existingToken = localStorage.getItem(STORAGE_KEY);

    if (!existingToken) return;

    try {
      const res = await fetch(
        `${SOCKET_URL}/api/auth/anonymous/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: existingToken }),
        }
      );

      const data = await res.json();

      setAnonUser((prev) =>
        prev
          ? {
              ...prev,
              displayName: data.displayName,
              avatarUrl: data.avatarUrl,
            }
          : prev
      );
    } catch (error) {
      console.error("REGENERATE IDENTITY FAILED:", error);
    }
  }, []);

  const logoutGuest = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAnonUser(null);
  }, []);

  return (
    <AnonymousAuthContext.Provider
      value={{
        anonUser,
        isAnonLoading,
        loginAsGuest,
        regenerateIdentity,
        logoutGuest,
      }}
    >
      {children}
    </AnonymousAuthContext.Provider>
  );
}

export function useAnonymousAuth() {
  const ctx = useContext(AnonymousAuthContext);

  if (!ctx) {
    throw new Error(
      "useAnonymousAuth must be used within AnonymousAuthProvider"
    );
  }

  return ctx;
}
