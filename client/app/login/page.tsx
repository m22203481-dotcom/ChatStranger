"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAnonymousAuth } from "@/contexts/AnonymousAuthContext";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { anonUser, loginAsGuest } = useAnonymousAuth();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  useEffect(() => {
    if (session || anonUser) {
      router.push("/chat");
    }
  }, [session, anonUser, router]);

const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    await loginAsGuest();
    setIsGuestLoading(false);
    router.push("/chat");
  };
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-center justify-center px-6">
      {/* Background Glow */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"></div>

      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>

      {/* Login Card */}
      <div
        className="
        relative
        z-10
        w-full
        max-w-md
        bg-gray-900/80
        backdrop-blur
        border
        border-gray-800
        rounded-3xl
        p-10
        text-center
        shadow-2xl
        "
      >
        <h1 className="text-4xl font-extrabold">StrangerConnect</h1>

        <p className="mt-4 text-gray-400">
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
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={isGuestLoading}
          className="
          mt-6
          w-full
          bg-gray-800
          text-white
          font-semibold
          py-4
          rounded-xl
          border
          border-gray-700
          hover:bg-gray-700
          hover:scale-105
          transition
          duration-300
          disabled:opacity-50
          disabled:hover:scale-100
          "
        >
          {isGuestLoading
            ? "Setting up your identity..."
            : "Continue as Guest"}
        </button>

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
          className="
          mt-8
          text-sm
          text-gray-400
          hover:text-white
          transition
          "
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
}
