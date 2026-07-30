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
        <p className="text-gray-400">
          Loading...
        </p>
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


        <h1 className="text-4xl font-extrabold">
          StrangerConnect
        </h1>


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




        <p className="mt-6 text-xs text-gray-500">
          By continuing, you agree to our{" "}

          <a
            href="/terms"
            className="text-blue-400 hover:underline"
          >
            Terms of Service
          </a>

          {" "}and{" "}

          <a
            href="/privacy"
            className="text-blue-400 hover:underline"
          >
            Privacy Policy
          </a>.

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