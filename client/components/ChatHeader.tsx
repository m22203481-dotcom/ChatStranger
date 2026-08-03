"use client";

import { useState } from "react";

type ChatHeaderProps = {
  status: string;
  onlineUsers: number;
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
  onlineUsers,
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
      className={`relative border-b px-4 py-4 flex flex-col gap-3 min-h-[90px] transition-colors ${
        isDark ? "border-gray-800" : "border-gray-200"
      }`}
    >
      <h1 className="text-2xl font-bold text-center">StrangerConnect</h1>

      <div className="flex items-center justify-between">
        <button
          onClick={onFriendsClick}
          className={`relative px-3 py-1 rounded-full text-sm font-semibold transition ${
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

        <div className="flex items-center gap-4 text-sm sm:text-base">
          <div className="text-blue-400 font-medium">
            👥 {onlineUsers} online
          </div>

          <button
            onClick={onReport}
            disabled={status !== "Connected"}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
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
            className="flex flex-col items-center ml-2"
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

            <span className={`text-xs max-w-[100px] truncate ${isDark ? "text-gray-300" : "text-gray-600"}`}>
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

          {/* HAMBURGER MENU — separate from the avatar, its own dropdown */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className={`w-9 h-9 flex flex-col items-center justify-center gap-1 rounded-full border transition ml-1 ${
              isDark
                ? "border-gray-700 hover:bg-gray-800"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            <span className={`block w-4 h-0.5 rounded-full transition ${menuOpen ? "translate-y-1.5 rotate-45" : ""} ${isDark ? "bg-white" : "bg-black"}`} />
            <span className={`block w-4 h-0.5 rounded-full transition ${menuOpen ? "opacity-0" : ""} ${isDark ? "bg-white" : "bg-black"}`} />
            <span className={`block w-4 h-0.5 rounded-full transition ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""} ${isDark ? "bg-white" : "bg-black"}`} />
          </button>
        </div>
      </div>

      {/* Click-outside backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
      )}

      {/* DROPDOWN MENU — Theme, Home, Buy Premium. Blocked Users moved
          to the profile card (opened via the avatar+name button) instead. */}
      {menuOpen && (
        <div
          className={`absolute right-4 top-full mt-2 w-56 rounded-2xl border overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200 ${
            isDark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200 shadow-xl"
          }`}
        >
          <button
            onClick={() => {
              onToggleTheme();
              setMenuOpen(false);
            }}
            className={`w-full text-left flex items-center gap-2 px-5 py-3 font-medium transition ${
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            {isDark ? "☀️" : "🌙"} {isDark ? "Light Theme" : "Dark Theme"}
          </button>

          <button
            onClick={() => {
              onGoHome();
              setMenuOpen(false);
            }}
            className={`w-full text-left flex items-center gap-2 px-5 py-3 font-medium border-t transition ${
              isDark ? "border-gray-800 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-100"
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
    </header>
  );
}
