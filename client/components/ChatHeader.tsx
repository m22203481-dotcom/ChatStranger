"use client";

import { useState } from "react";
import Image from "next/image";
type ChatHeaderProps = {
  status: string;
  onReport: () => void;
  profile: {
    name: string;
    image: string;
    isGuest: boolean;
    isPremium?: boolean;
  };
  onProfileClick: () => void;
  onFriendsClick: () => void;
  hasUnreadDMs?: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onGoHome: () => void;
  onBuyPremium: () => void;
};



export default function ChatHeader({
  status,
  onReport,
  profile,
  onProfileClick,
  onFriendsClick,
  hasUnreadDMs,
  isDark,
  onToggleTheme,
  onGoHome,
  onBuyPremium,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={`relative border-b px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:py-4 flex flex-col gap-3 min-h-[90px] transition-colors ${
        isDark ? "border-gray-800" : "border-gray-200"
      }`}
    >
      {/* TOP ROW — mirrors the homepage nav: title on the left, theme
          toggle + hamburger parallel to it on the right */}
      <div className="relative flex items-center justify-end">
       <Image
  src="/logo.png"
  alt="ChatStranger"
  width={240}
  height={60}
  priority
  className="absolute left-1/2 -translate-x-1/2 h-auto w-[160px] sm:w-[220px]"
/> 

        <div className="flex items-center gap-2 sm:gap-3">
          {/* THEME TOGGLE — same as homepage, separate from the hamburger */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full border transition ${
              isDark
                ? "border-gray-700 hover:bg-gray-800"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* HAMBURGER MENU — now just Home + Buy Premium. Wrapped in its
              own relative container so the dropdown opens right under
              THIS button, not below the whole two-row header. */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className={`w-10 h-10 shrink-0 flex flex-col items-center justify-center gap-1 rounded-full border transition ${
                isDark
                  ? "border-gray-700 hover:bg-gray-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              <span className={`block w-4 h-0.5 rounded-full transition ${menuOpen ? "translate-y-1.5 rotate-45" : ""} ${isDark ? "bg-white" : "bg-black"}`} />
              <span className={`block w-4 h-0.5 rounded-full transition ${menuOpen ? "opacity-0" : ""} ${isDark ? "bg-white" : "bg-black"}`} />
              <span className={`block w-4 h-0.5 rounded-full transition ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""} ${isDark ? "bg-white" : "bg-black"}`} />
            </button>

            {/* Click-outside backdrop */}
            {menuOpen && (
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            )}

            {/* DROPDOWN MENU — Home, Buy Premium. Theme has its own
                button to the left, and Blocked Users lives in the
                profile card (opened via the avatar+name button). */}
            {menuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-56 rounded-2xl border overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200 ${
                  isDark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200 shadow-xl"
                }`}
              >
                <button
                  onClick={() => {
                    onGoHome();
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left flex items-center gap-2 px-5 py-3 font-medium transition ${
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  }`}
                >
                  🏠 Home
                </button>

                <button
                  onClick={() => {
                    onBuyPremium();
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left flex items-center gap-2 px-5 py-3 font-medium border-t transition ${
                    isDark ? "border-gray-800 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  👑 Buy Premium
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECOND ROW — Friends on the left; online count, Report, and the
          profile avatar grouped a bit further toward the right edge now
          that the hamburger/theme buttons have moved up to the top row */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onFriendsClick}
          className={`relative px-3 py-2 rounded-full text-sm font-semibold transition shrink-0 ${
            isDark
              ? "bg-gray-800 hover:bg-gray-700"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Friends
          {hasUnreadDMs && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse" />
          )}
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onReport}
            disabled={status !== "Connected"}
            className={`px-3 py-2 rounded-full text-sm font-semibold transition shrink-0 ${
              status === "Connected"
                ? "bg-yellow-600 hover:bg-yellow-700"
                : `${isDark ? "bg-gray-700" : "bg-gray-200"} opacity-50 cursor-not-allowed`
            }`}
          >
            Report
          </button>

          {/* AVATAR + NAME — opens the profile card, same as before */}
          <button
            onClick={onProfileClick}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <img

                referrerPolicy="no-referrer"
                src={profile.image || "/default-avatar.png"}
                alt="Profile"
                className={`w-10 h-10 rounded-full border hover:scale-110 transition ${
                  isDark ? "border-gray-700" : "border-gray-300"
                }`}
              />

              {profile.isPremium && (
                <span
                  className="absolute -top-1 -right-1 text-xs"
                  title="Premium"
                >
                  👑
                </span>
              )}
            </div>

            <span className={`text-xs max-w-[70px] sm:max-w-[100px] truncate ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {profile.name}
            </span>

            {profile.isGuest && (
              <span
                className={`text-[9px] px-1 rounded mt-1 ${
                  isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
                }`}
              >
                Guest
              </span>
            )}
          </button>
        </div>
      </div>

    </header>
  );
}
