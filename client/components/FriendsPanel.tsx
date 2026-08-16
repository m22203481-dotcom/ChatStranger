"use client";

import { useEffect, useRef, useState } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import type { Friend, FriendMessage } from "@/app/hooks/useFriends";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

type FriendsPanelProps = {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  activeFriendChat: {
    conversationId: string;
    roomName: string;
    friend: Friend;
    messages: FriendMessage[];
  } | null;
  onOpenChat: (friend: Friend) => void;
  onSendMessage: (text: string) => void;
  onSendFile: (uploaded: {
    url: string;
    type: "image" | "video" | "file";
    name: string;
  }) => void;
  onCloseChat: () => void;
  unreadCounts?: Record<string, number>;
  isPremium?: boolean;
  onPremiumRequired?: () => void;
  onRemoveFriend?: (friendUserId: string) => void;
  onBlockFriend?: (friendUserId: string) => void;
};

export default function FriendsPanel({
  isOpen,
  onClose,
  friends,
  activeFriendChat,
  onOpenChat,
  onSendMessage,
  onSendFile,
  onCloseChat,
  unreadCounts,
  isPremium,
  onPremiumRequired,
  onRemoveFriend,
  onBlockFriend,
  isDark,
}: FriendsPanelProps) {
  const [draft, setDraft] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message, same pattern as the stranger-chat
  // ChatMessages component. Also fires when the conversationId changes,
  // so switching to a different friend's chat starts scrolled to bottom.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeFriendChat?.messages, activeFriendChat?.conversationId]);

useEffect(() => {
  if (!showEmojiPicker) return;

  const handleOutsideClick = (event: MouseEvent) => {
    const target = event.target as Node;

    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current.contains(target)
    ) {
      setShowEmojiPicker(false);
    }
  };

  document.addEventListener("click", handleOutsideClick);

  return () => {
    document.removeEventListener("click", handleOutsideClick);
  };
}, [showEmojiPicker]);


  if (!isOpen) return null;

  const handleSend = () => {
    if (!draft.trim()) return;
    onSendMessage(draft);
    setDraft("");
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!isPremium) {
      onPremiumRequired?.();
      return;
    }

    setIsUploading(true);

    try {
      const uploaded = await uploadToCloudinary(file);
      onSendFile(uploaded);
    } catch (error: any) {
      alert(error?.message || "Upload failed — please try again");
    } finally {
      setIsUploading(false);
    }
  };
  const handleEmojiClick = (emojiData: EmojiClickData) => {
  setDraft((prev) => prev + emojiData.emoji);
  setShowEmojiPicker(false);
};

  // Border color used for the little dots/badges layered on avatars —
  // needs to match whatever background sits behind them so the dot
  // reads as a clean cutout in both themes
  const avatarBadgeBorder = isDark ? "border-gray-950" : "border-white";

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-sm h-full flex flex-col border-r transition-colors ${
          isDark
            ? "bg-gray-950 border-gray-800 text-white"
            : "bg-white border-gray-200 text-black shadow-xl"
        }`}
      >
        {activeFriendChat ? (
          <>
            <div className={`flex items-center gap-2 p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
              <button
                onClick={onCloseChat}
                aria-label="Back to friends list"
                className={`w-9 h-9 shrink-0 -ml-1 flex items-center justify-center rounded-full text-lg transition ${
                  isDark ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-black hover:bg-gray-100"
                }`}
              >
                ←
              </button>

              <div className="relative">
                <img

                  referrerPolicy="no-referrer"
                  src={activeFriendChat.friend.avatarUrl}
                  alt={activeFriendChat.friend.displayName}
                  className="w-8 h-8 rounded-full"
                />

                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${avatarBadgeBorder} ${
                    activeFriendChat.friend.isOnline
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />

                {activeFriendChat.friend.isPremium && (
                  <span className="absolute -top-1 -right-1 text-xs" title="Premium">
                    👑
                  </span>
                )}
              </div>

              <span className="font-semibold truncate">
                {activeFriendChat.friend.displayName}
              </span>

              <button
                onClick={onClose}
                aria-label="Close friends panel"
                className={`ml-auto w-9 h-9 shrink-0 -mr-1 flex items-center justify-center rounded-full text-xl transition ${
                  isDark ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-black hover:bg-gray-100"
                }`}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {activeFriendChat.messages.length === 0 && (
                <p className={`text-sm text-center mt-6 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  No messages yet. Say hi!
                </p>
              )}

              {activeFriendChat.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.sender === "me" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-3 py-2 max-w-[75%] text-sm ${
                      msg.sender === "me"
                        ? "bg-blue-600 text-white"
                        : isDark
                        ? "bg-gray-800 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {msg.fileUrl ? (
                      msg.fileType === "image" ? (
                        <img

                          referrerPolicy="no-referrer"
                          src={msg.fileUrl}
                          alt={msg.fileName ?? "image"}
                          className="rounded-lg max-w-full max-h-56 object-cover"
                        />
                      ) : msg.fileType === "video" ? (
                        <video
                          src={msg.fileUrl}
                          controls
                          className="rounded-lg max-w-full max-h-56"
                        />
                      ) : (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 underline"
                        >
                          📎 {msg.fileName ?? "Download file"}
                        </a>
                      )
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}

              <div ref={bottomRef} />
            </div>

            <div className={`p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t flex items-center gap-2 ${isDark ? "border-gray-800" : "border-gray-200"}`}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
              />

              <div className="relative flex-1">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Message..."
                  className={`w-full rounded-full border pl-12 pr-11 py-2.5 text-base outline-none transition ${
                    isDark
                      ? "bg-gray-900 border-gray-800 text-white placeholder-gray-500"
                      : "bg-gray-100 border-gray-300 text-black placeholder-gray-400"
                  }`}
                />

               {/* EMOJI BUTTON + PICKER */}
<div ref={emojiPickerRef}>
  {/* EMOJI BUTTON */}
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.currentTarget.blur();
      setShowEmojiPicker((prev) => !prev);
    }}
    aria-label="Open emoji picker"
    title="Emoji"
    className={`absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-xl transition ${
      isDark
        ? "hover:bg-gray-700 text-gray-300"
        : "hover:bg-gray-200 text-gray-600"
    }`}
  >
    😊
  </button>

  {/* EMOJI PICKER */}
  {showEmojiPicker && (
    <div className="absolute bottom-14 left-0 z-50">
      <EmojiPicker
        onEmojiClick={handleEmojiClick}
        theme={isDark ? Theme.DARK : Theme.LIGHT}
        width={320}
        height={400}
        searchDisabled={false}
        skinTonesDisabled={false}
        autoFocusSearch={false}
      />
    </div>
  )}
</div>
                 
                <button
                  onClick={() => {
                    if (!isPremium) {
                      onPremiumRequired?.();
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  title={!isPremium ? "Sending photos/videos is a premium feature" : undefined}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-sm ${
                    isUploading
                      ? "text-gray-500 cursor-not-allowed"
                      : isDark
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-gray-200 text-gray-600"
                  }`}
                >
                  {isUploading ? "..." : "📎"}
                </button>
              </div>

             {/* SEND BUTTON */}
<button
  onClick={handleSend}
  disabled={!draft.trim()}
  aria-label="Send message"
  title="Send message"
  className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all ${
    draft.trim()
      ? "bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105 shadow-lg shadow-purple-500/20"
      : isDark
        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
        : "bg-gray-300 text-gray-400 cursor-not-allowed"
  }`}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 text-white rotate-45"
  >
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
</button> 
            </div>
          </>
        ) : (
          <>
            <div className={`flex items-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
              <h2 className="font-bold text-lg">Friends</h2>

              <button
                onClick={onClose}
                aria-label="Close friends panel"
                className={`ml-auto w-9 h-9 shrink-0 -mr-1 flex items-center justify-center rounded-full text-xl transition ${
                  isDark ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-black hover:bg-gray-100"
                }`}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {friends.length === 0 ? (
                <p className={`text-sm text-center mt-8 px-6 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                  No friends yet. Add someone while chatting to start
                  building your list!
                </p>
              ) : (
                friends.map((friend) => {
                  const unreadCount = unreadCounts?.[friend.userId] ?? 0;

                  return (
                  <div
                    key={friend.userId}
                    className={`w-full flex items-center gap-2 px-4 py-3 transition ${
                      isDark ? "hover:bg-gray-900" : "hover:bg-gray-100"
                    }`}
                  >
                    <button
                      onClick={() => onOpenChat(friend)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="relative shrink-0">
                        <img

                          referrerPolicy="no-referrer"
                          src={friend.avatarUrl}
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-full"
                        />

                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${avatarBadgeBorder} ${
                            friend.isOnline ? "bg-green-500" : "bg-red-500"
                          }`}
                        />

                        {friend.isPremium && (
                          <span className="absolute -top-1 -right-1 text-xs" title="Premium">
                            👑
                          </span>
                        )}

                        {unreadCount > 0 && (
                          <span
                            className={`absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-500 border-2 ${avatarBadgeBorder}`}
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>

                      <span className="font-medium truncate">
                        {friend.displayName}
                      </span>
                    </button>

                    {/* THREE-DOT MENU — after the name, with breathing
                        room so it doesn't feel cramped against the text */}
                    <div className="relative shrink-0 ml-2">
                      <button
                        onClick={() =>
                          setOpenMenuFor((prev) =>
                            prev === friend.userId ? null : friend.userId
                          )
                        }
                        aria-label="Friend options"
                        aria-expanded={openMenuFor === friend.userId}
                       className={`w-9 h-9 flex items-center justify-center rounded-full text-3xl leading-none font-bold ${
  isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
}`} 
                      >
                        ⋮
                      </button>

                      {openMenuFor === friend.userId && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setOpenMenuFor(null)}
                          />

                          <div
                            className={`absolute right-0 top-full mt-1 w-40 rounded-xl border overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200 ${
                              isDark
                                ? "bg-gray-950 border-gray-800"
                                : "bg-white border-gray-200 shadow-xl"
                            }`}
                          >
                            <button
                              onClick={() => {
                                onRemoveFriend?.(friend.userId);
                                setOpenMenuFor(null);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm font-medium transition ${
                                isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                              }`}
                            >
                              💔 Remove Friend
                            </button>

                            <button
                              onClick={() => {
                                onBlockFriend?.(friend.userId);
                                setOpenMenuFor(null);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm font-medium border-t transition text-red-400 ${
                                isDark
                                  ? "border-gray-800 hover:bg-gray-800"
                                  : "border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              🚫 Block User
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
