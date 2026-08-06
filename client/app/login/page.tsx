"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAnonymousAuth } from "@/contexts/AnonymousAuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { anonUser, loginAsGuest } = useAnonymousAuth();
  const { isDark } = useTheme();
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  // This is the ONLY place that navigates to /chat for a guest. It only
  // fires once anonUser is actually set — so a failed login never sends
  // you to /chat with no identity, which is what caused the "bounces
  // back to login" symptom before.
  useEffect(() => {
    if (session || anonUser) {
      router.push("/chat");
    }
  }, [session, anonUser, router]);

  const handleGuestLogin = async () => {
    setGuestError(null);
    setIsGuestLoading(true);

    try {
      await loginAsGuest();
      // No router.push here — the effect above handles it once anonUser
      // updates. If loginAsGuest failed, it threw and we land in catch
      // instead, so we never navigate to /chat without a real identity.
    } catch (error) {
      setGuestError(
        "Couldn't connect right now — our server may be waking up from idle. Please try again in a few seconds."
      );
    } finally {
      setIsGuestLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <main
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading...</p>
      </main>
    );
  }

  return (
    <main
      className={`relative min-h-screen overflow-hidden flex items-center justify-center px-6 transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-b from-black via-gray-900 to-black text-white"
          : "bg-gradient-to-b from-white via-gray-100 to-white text-black"
      }`}
    >
      {/* Background Glow */}
      <div className={`absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl ${isDark ? "bg-blue-600/20" : "bg-blue-400/25"}`}></div>

      <div className={`absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl ${isDark ? "bg-purple-600/20" : "bg-purple-400/25"}`}></div>

      {/* Login Card */}
      <div
        className={`relative z-10 w-full max-w-md backdrop-blur border rounded-3xl p-10 text-center shadow-2xl ${
          isDark
            ? "bg-gray-900/80 border-gray-800"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <h1 className="text-4xl font-extrabold">ChatStranger</h1>

        <p className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Connect with strangers around the world.
          <br />
          Start your conversation instantly.
        </p>

        <button
          onClick={() =>
            signIn("google", {
              callbackUrl: "/chat",
            })
          }
          className="
          mt-10
          w-full
          bg-white
          text-black
          font-semibold
          py-4
          rounded-xl
          hover:bg-gray-200
          hover:scale-105
          transition
          duration-300
          "
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mt-6">
          <div className={`flex-1 h-px ${isDark ? "bg-gray-800" : "bg-gray-300"}`} />
          <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>OR</span>
          <div className={`flex-1 h-px ${isDark ? "bg-gray-800" : "bg-gray-300"}`} />
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={isGuestLoading}
          className={`mt-6 w-full font-semibold py-4 rounded-xl border hover:scale-105 transition duration-300 disabled:opacity-50 disabled:hover:scale-100 ${
            isDark
              ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              : "bg-gray-100 text-black border-gray-300 hover:bg-gray-200"
          }`}
        >
          {isGuestLoading
            ? "Setting up your identity..."
            : "Continue as Guest"}
        </button>

        {guestError && (
          <p className="mt-3 text-sm text-red-400">{guestError}</p>
        )}

        <p className="mt-3 text-xs text-gray-500">
          You'll get a random name and avatar. No account needed —
          chat history saves to this browser.
        </p>

        <p className="mt-6 text-xs text-gray-500">
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-blue-400 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-blue-400 hover:underline">
            Privacy Policy
          </a>
          .
        </p>

        <button
          onClick={() => router.push("/")}
          className={`mt-8 text-sm transition ${
            isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"
          }`}
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
}
