"use client";

import { useState } from "react";
import type { Friend, FriendMessage } from "@/app/hooks/useFriends";

type FriendsPanelProps = {
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
  onCloseChat: () => void;
  unreadFriendIds?: Set<string>;
};

export default function FriendsPanel({
  isOpen,
  onClose,
  friends,
  activeFriendChat,
  onOpenChat,
  onSendMessage,
  onCloseChat,
  unreadFriendIds,
}: FriendsPanelProps) {
  const [draft, setDraft] = useState("");

  if (!isOpen) return null;

  const handleSend = () => {
    if (!draft.trim()) return;
    onSendMessage(draft);
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-gray-950 border-r border-gray-800 h-full flex flex-col">
        {activeFriendChat ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-gray-800">
              <button
                onClick={onCloseChat}
                className="text-gray-400 hover:text-white"
              >
                ←
              </button>

              <div className="relative">
                <img
                  src={activeFriendChat.friend.avatarUrl}
                  alt={activeFriendChat.friend.displayName}
                  className="w-8 h-8 rounded-full"
                />

                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-950 ${
                    activeFriendChat.friend.isOnline
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
              </div>

              <span className="font-semibold">
                {activeFriendChat.friend.displayName}
              </span>

              <button
                onClick={onClose}
                className="ml-auto text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {activeFriendChat.messages.length === 0 && (
                <p className="text-gray-500 text-sm text-center mt-6">
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
                        ? "bg-blue-600"
                        : "bg-gray-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-800 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Message..."
                className="flex-1 rounded-full bg-gray-900 border border-gray-800 px-4 py-2 text-sm outline-none"
              />

              <button
                onClick={handleSend}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full text-sm font-semibold"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center p-4 border-b border-gray-800">
              <h2 className="font-bold text-lg">Friends</h2>

              <button
                onClick={onClose}
                className="ml-auto text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {friends.length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-8 px-6">
                  No friends yet. Add someone while chatting to start
                  building your list!
                </p>
              ) : (
                friends.map((friend) => (
                  <button
                    key={friend.userId}
                    onClick={() => onOpenChat(friend)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 transition text-left"
                  >
                    <div className="relative">
                      <img
                        src={friend.avatarUrl}
                        alt={friend.displayName}
                        className="w-10 h-10 rounded-full"
                      />

                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-950 ${
                          friend.isOnline ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                    </div>

                    <span className="font-medium flex items-center gap-2">
                      {friend.displayName}
                      {unreadFriendIds?.has(friend.userId) && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
