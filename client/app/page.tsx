"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Image from "next/image";
export default function Home() {

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ChatStranger",
  "url": "https://www.chatstranger.chat",
  "applicationCategory": "SocialNetworkingApplication",
  "operatingSystem": "Web",
  "description":
    "ChatStranger is a free anonymous chat platform to talk with strangers online and start real-time conversations instantly.",
};

  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // Drives the top scroll-progress bar and the subtle background-blob
  // parallax — both purely presentational, so a plain scroll listener
  // (no extra libraries) is enough.
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setScrollY(window.scrollY);
        setScrollProgress(max > 0 ? window.scrollY / max : 0);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "#about" },
    { label: "Features", href: "#features" },
    { label: "Login", href: "/login" },
  ];

  const faqs = [
    {
      q: "Is ChatStranger completely free?",
      a: "Yes. ChatStranger is free to use. During early access, premium features are also available at no cost.",
    },
    {
      q: "Do I need to create an account?",
      a: "No. You can start chatting anonymously without creating an account. Creating an account simply unlocks additional features and helps personalize your experience.",
    },
    {
      q: "How does interest-based matching work?",
      a: "Add your interests before searching for a chat. ChatStranger will try to connect you with people who share similar interests, making conversations more meaningful.",
    },
    {
      q: "Is ChatStranger anonymous?",
      a: "Yes. We do not require you to reveal your identity. You choose what information to share during conversations.",
    },
    {
      q: "Can I make friends on ChatStranger?",
      a: "Absolutely. Many users join ChatStranger to meet new people, discover shared interests, and build genuine friendships through conversation.",
    },
    {
      q: "Is ChatStranger safe?",
      a: "We provide reporting tools, moderation systems, and privacy-focused features to help keep the platform safe and enjoyable for everyone.",
    },
  ];

  
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.a,
    },
  })),
};

  return (
    
    <main
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-b from-black via-gray-900 to-black text-white"
          : "bg-gradient-to-b from-slate-50 via-blue-50 to-purple-50  text-black"
      }`}
    >
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd),
  }}
/>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(faqJsonLd),
  }}
/>



      {/* SCROLL PROGRESS BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Background Glow Effects — drift slightly as you scroll for a
          touch of depth/parallax */}
      <div
        className={`absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
          isDark ? "bg-blue-400/40" : "bg-blue-400/35"
        }`}
        style={{ transform: `translateY(${scrollY * 0.08}px)` }}
      ></div>

      <div
        className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isDark ? "bg-purple-600/20" : "bg-purple-400/25"
        }`}
        style={{ transform: `translateY(${scrollY * -0.05}px)` }}
      ></div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-end px-4 sm:px-10 py-4 sm:py-6">
        <div className="absolute left-1/2 -translate-x-1/2 text-2xl sm:text-3xl lg:text-4xl font-bold">
          ChatStranger
        </div>

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
      <section className="relative z-10 mt-12 lg:mt-24 px-6">
  <div className="max-w-7xl mx-auto lg:flex lg:items-center lg:gap-16">

    {/* LEFT SIDE */}
    <div className="lg:w-1/2 text-center lg:text-left">

      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
        Chat With Strangers
        <br />
       <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-blue-600"
        style={{ WebkitBackgroundClip: "text" }}
        >
        Instantly
        </span>
      </h1>

      <p
        className={`mt-8 text-lg sm:text-xl max-w-2xl lg:max-w-xl ${
          isDark ? "text-gray-400" : "text-gray-800"
        }`}
      >
        Chat anonymously with strangers online from around the world.
        No registration. No personal information. Just conversations.
      </p>

     <div className="mt-10 inline-block">
  <a
    href="/login"
    className="inline-block rounded-full bg-blue-600 hover:bg-blue-700 hover:scale-105 transition duration-300 px-10 py-5 text-2xl font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.6)]"
  >
    Start Chatting →
  </a>
</div> 
      <p
        className={`mt-4 text-sm ${
          isDark ? "text-gray-500" : "text-gray-500"
        }`}
      >
        ✨ Anonymous • Interest-Based Matching • Free Premium Access
      </p>

    </div>

   {/* RIGHT SIDE */}
<div className="relative mt-16 lg:mt-0 lg:w-1/2">

  <div className="hidden lg:block absolute -top-8 right-16 text-4xl animate-bounce">
    ✨
  </div>

  <div className="hidden lg:block absolute top-32 -left-6 text-3xl">
    💬
  </div>

  <div className="hidden lg:block absolute bottom-10 right-0 text-4xl">
    🚀
  </div>

 <Image
  src="/homepage-chat-preview.webp"
  alt="ChatStranger chat preview"
  width={1600}
  height={900}
  priority
  className="w-full max-w-3xl mx-auto [animation:float_6s_ease-in-out_infinite]"
/>
</div>

  </div>
  
</section>
      
      {/* About Section */}
      <Reveal className="relative z-10 mt-16 lg:mt-24 px-6 text-center">
        <section id="about">
        <h2
  className={`text-4xl lg:text-5xl font-extrabold ${
    isDark ? "text-white" : "text-gray-900"
  }`}
>
  What is ChatStranger?
</h2> 

          <p
            className={`mt-6 text-lg max-w-3xl mx-auto ${
              isDark ? "text-gray-400" : "text-gray-800"
            }`}
          >
            ChatStranger is a free anonymous chat platform where people can chat with strangers online, meet new people, and start real-time anonymous conversations instantly.
            No profiles. No pressure. Just real conversations.
          </p>
        </section>
      </Reveal>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 mt-32 px-6 pb-2 space-y-14 max-w-3xl lg:max-w-5xl mx-auto"
      >
        <Reveal>
          <div
            className={`rounded-2xl p-6 lg:p-10 text-center lg:text-left hover:-translate-y-2 transition duration-300 ${
              isDark ? "bg-gray-900" : "bg-gray-100 border border-gray-200"
            } lg:flex lg:items-center lg:gap-10`}
          >
           <Image
  src="/mask.webp"
  alt="Anonymous chat with strangers on ChatStranger"
  width={1000}
  height={1000}
  loading="lazy"
  className="w-full max-w-xs sm:max-w-sm mx-auto h-auto -mb-1 lg:mb-0 lg:w-1/2 lg:order-2"
/>

            <div className="lg:w-1/2 lg:order-1">
              <h3 className="text-2xl font-extrabold tracking-wide">
                Truly Anonymous Chats with Strangers
              </h3>

              <p className={`mt-3 ${isDark ? "text-gray-400" : "text-gray-800"}`}>
                No profiles. No distractions.
                <br />
                Just meaningful connections with anonymous people with whom you can share whatever you like.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div
            className={`rounded-2xl p-8 lg:p-10 text-center lg:text-left hover:-translate-y-2 transition duration-300 ${
              isDark ? "bg-gray-900" : "bg-gray-100 border border-gray-200"
            } lg:flex lg:items-center lg:gap-10`}
          >
            <div className="text-7xl mb-4 lg:mb-0 lg:w-1/2 lg:order-1 lg:text-center">
              🔥
            </div>

            <div className="lg:w-1/2 lg:order-1">
              <h3 className="text-2xl font-extrabold">
                No Swipes. Just Vibes.
              </h3>

              <p className={`mt-3 ${isDark ? "text-gray-400" : "text-gray-800"}`}>
                Forget profiles and algorithms.
                <br />
                Jump straight into the conversation with strangers who matches your vibes and start building meaningful connections.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="text-center lg:text-left lg:flex lg:items-center lg:gap-10">
           <Image
  src="/interests.webp"
  alt="ChatStranger interest based matching"
  width={1200}
  height={800}
  loading="lazy"
  className="w-full max-w-2xl mx-auto h-auto mb-2 lg:mb-0 lg:w-1/2 lg:order-2"
/> 

            <p className={`mt-3 text-lg lg:w-1/2 lg:order-1 ${isDark ? "text-gray-400" : "text-gray-800"}`}>
              No random small talk.
              <br />
              Match with people on your wavelength and dive deep into the topics you both love.
              <br />
              It is as simple as it looks to connect with the people of similar interests.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div
            className={`rounded-2xl p-8 lg:p-10 text-center lg:text-left hover:-translate-y-2 transition duration-300 ${
              isDark ? "bg-gray-900" : "bg-gray-100 border border-gray-200"
            } lg:flex lg:items-center lg:gap-10`}
          >
           <Image
  src="/premium.webp"
  alt="ChatStranger premium features are free"
  width={1200}
  height={800}
  loading="lazy"
  className="w-full max-w-md mx-auto h-auto mb-4 lg:mb-0 lg:w-1/2 lg:order-2"
/> 

            <p className={`mt-3 text-center lg:text-left lg:w-1/2 lg:order-1 ${isDark ? "text-gray-400" : "text-gray-800"}`}>
              Enjoy premium features completely free during our early access period.
              Choose gender preferences, get priority matching, share unlimited media,
              and unlock future premium upgrades at no cost.
              <br />
              <br />
              ChatStranger is a free anonymous chat platform designed to help you
              meet new people, make friends online, and connect with strangers who
              share your interests. No subscriptions, no hidden fees, and no paywalls—
              just real conversations with real people from around the world.
            </p>
          </div>
        </Reveal>
      </section>

      {/* FAQ Section */}


      <section className="max-w-4xl mx-auto px-6 pt-12 pb-20">
        <Reveal>
        <h2
  className={`text-4xl font-extrabold text-center mb-12 ${
    isDark ? "text-white" : "text-gray-900"
  }`}
>
  Frequently Asked Questions
</h2>  
        </Reveal>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 60}>
              <div
                className={`rounded-2xl p-6 transition hover:-translate-y-1 ${
                  isDark
                    ? "bg-gray-900"
                    : "bg-gray-100 border border-gray-200"
                }`}
              >
                <h3 className="text-xl font-semibold">{faq.q}</h3>
                <p className={`mt-3 ${isDark ? "text-gray-400" : "text-gray-800"}`}>
                  {faq.a}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`relative z-10 border-t mt-20 py-10 text-center ${
          isDark ? "border-gray-800 text-gray-500" : "border-gray-200 text-gray-500"
        }`}
      >
        <h3 className={`text-xl font-bold ${
          isDark ? "text-white" : "text-gray-900"}`}>
          ChatStranger
        </h3>

        <p className="mt-3">Connect. Chat. Discover.</p>

        <div className="flex justify-center gap-6 mt-6 text-sm">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>

          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
        </div>

        <p className="mt-4 text-sm max-w-2xl mx-auto">
          Anonymous chat platform for meeting new people, making friends,
          and connecting through shared interests.
        </p>

        <p className="mt-6 text-sm">© 2026 ChatStranger. All rights reserved.</p>
      </footer>

      {/* Local keyframes for the hero image's float animation — scoped
          to this page via styled-jsx, no changes to globals.css needed */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-14px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </main>
  );
}
