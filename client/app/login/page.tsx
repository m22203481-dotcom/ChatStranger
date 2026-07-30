"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/chat");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl text-center w-96">
        <h1 className="text-3xl font-bold mb-4">
          StrangerConnect
        </h1>

        <p className="text-gray-400 mb-6">
          Continue with Google to start chatting
        </p>

        <button
          onClick={() =>
  signIn("google", {
    callbackUrl: "/chat",
  })
}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200"
        >
          Continue with Google
        </button>
        <p className="text-xs text-gray-400 text-center mt-4 max-w-sm">
  By continuing, you agree to our{" "}
  <a
    href="/terms"
    className="text-blue-400 hover:underline"
  >
    Terms of Service
  </a>{" "}
  and{" "}
  <a
    href="/privacy"
    className="text-blue-400 hover:underline"
  >
    Privacy Policy
  </a>.
</p>
      </div>
    </main>
  );
}