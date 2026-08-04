"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "#about" },
    { label: "Features", href: "#features" },
    { label: "Login", href: "/login" },
  ];

  return (
    <main
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-b from-black via-gray-900 to-black text-white"
          : "bg-gradient-to-b from-white via-gray-100 to-white text-black"
      }`}
    >

      {/* Background Glow Effects */}
      <div
        className={`absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl ${
          isDark ? "bg-blue-600/20" : "bg-blue-400/25"
        }`}
      ></div>

      <div
        className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl ${
          isDark ? "bg-purple-600/20" : "bg-purple-400/25"
        }`}
      ></div>


      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-end px-4 sm:px-10 py-4 sm:py-6">

        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl sm:text-3xl font-bold">
          StrangerConnect
        </h1>

        <div className="flex items-center gap-3">

          {/* THEME TOGGLE — left of the hamburger */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className={`w-10 h-10 flex items-center justify-center rounded-full border transition ${
              isDark
                ? "border-gray-700 hover:bg-gray-800"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* HAMBURGER MENU BUTTON */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className={`w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-full border transition ${
              isDark
                ? "border-gray-700 hover:bg-gray-800"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            <span
              className={`block w-5 h-0.5 rounded-full transition ${
                menuOpen ? "translate-y-2 rotate-45" : ""
              } ${isDark ? "bg-white" : "bg-black"}`}
            />
            <span
              className={`block w-5 h-0.5 rounded-full transition ${
                menuOpen ? "opacity-0" : ""
              } ${isDark ? "bg-white" : "bg-black"}`}
            />
            <span
              className={`block w-5 h-0.5 rounded-full transition ${
                menuOpen ? "-translate-y-2 -rotate-45" : ""
              } ${isDark ? "bg-white" : "bg-black"}`}
            />
          </button>

        </div>

      </nav>

      {/* Click-outside backdrop for the dropdown */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* DROPDOWN MENU — drops down from the hamburger */}
      {menuOpen && (
        <div
          className={`relative z-20 mx-4 sm:mx-10 -mt-2 mb-2 rounded-2xl border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
            isDark
              ? "bg-gray-950 border-gray-800"
              : "bg-white border-gray-200 shadow-xl"
          }`}
        >
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-6 py-3 font-medium transition ${
                i > 0 ? (isDark ? "border-t border-gray-800" : "border-t border-gray-200") : ""
              } ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}


      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center mt-20 sm:mt-28 px-6">


        <h2 className="text-4xl sm:text-6xl font-extrabold leading-tight">
          Meet New People
          <br />
          Instantly
        </h2>


        <p className={`mt-8 text-lg sm:text-xl max-w-2xl ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Chat anonymously with strangers from around the world.
          No registration. No personal information. Just conversations.
        </p>


        <a
          href="/login"
          className="
          mt-10
          inline-block
          rounded-full
          bg-blue-600
          hover:bg-blue-700
          hover:scale-105
          transition
          duration-300
          px-10
          py-5
          text-2xl
          font-semibold
          shadow-lg
          text-white
          "
        >
          Start Chatting →
        </a>


      </section>



      {/* About Section */}
      <section
        id="about"
        className="relative z-10 mt-32 px-10 text-center"
      >

        <h2 className="text-4xl font-bold">
          What is StrangerConnect?
        </h2>


        <p className={`mt-6 text-lg max-w-3xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          StrangerConnect is a platform where people can meet
          new strangers instantly through anonymous conversations.
          No profiles. No pressure. Just real conversations.
        </p>


      </section>




      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 mt-32 px-10 pb-20"
      >


        <div
          className={`rounded-2xl p-6 hover:-translate-y-2 transition duration-300 ${
            isDark ? "bg-gray-900" : "bg-gray-100 border border-gray-200"
          }`}
        >
          <h3 className="text-xl font-bold">
            Anonymous
          </h3>

          <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            No signup required.
          </p>
        </div>



        <div
          className={`rounded-2xl p-6 hover:-translate-y-2 transition duration-300 ${
            isDark ? "bg-gray-900" : "bg-gray-100 border border-gray-200"
          }`}
        >
          <h3 className="text-xl font-bold">
            Instant Match
          </h3>

          <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Connect in seconds.
          </p>
        </div>



        <div
          className={`rounded-2xl p-6 hover:-translate-y-2 transition duration-300 ${
            isDark ? "bg-gray-900" : "bg-gray-100 border border-gray-200"
          }`}
        >
          <h3 className="text-xl font-bold">
            Secure
          </h3>

          <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Privacy comes first.
          </p>
        </div>



        <div
          className={`rounded-2xl p-6 hover:-translate-y-2 transition duration-300 ${
            isDark ? "bg-gray-900" : "bg-gray-100 border border-gray-200"
          }`}
        >
          <h3 className="text-xl font-bold">
            Free
          </h3>

          <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Start chatting anytime.
          </p>
        </div>


      </section>




      {/* Footer */}
      <footer
        className={`relative z-10 border-t mt-20 py-10 text-center ${
          isDark ? "border-gray-800 text-gray-500" : "border-gray-200 text-gray-500"
        }`}
      >


        <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
          StrangerConnect
        </h3>


        <p className="mt-3">
          Connect. Chat. Discover.
        </p>


        <p className="mt-6 text-sm">
          © 2026 StrangerConnect. All rights reserved.
        </p>


      </footer>


    </main>
  );
}
