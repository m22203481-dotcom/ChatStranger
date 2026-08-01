"use client";

import { useRef, useState } from "react";
import type { Friend, FriendMessage } from "@/app/hooks/useFriends";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

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
  onSendFile: (uploaded: {
    url: string;
    type: "image" | "video" | "file";
    name: string;
  }) => void;
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
  onSendFile,
  onCloseChat,
  unreadFriendIds,
}: FriendsPanelProps) {
  const [draft, setDraft] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                    {msg.fileUrl ? (
                      msg.fileType === "image" ? (
                        <img
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
            </div>

            <div className="p-3 border-t border-gray-800 flex gap-2">
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
                  className="w-full rounded-full bg-gray-900 border border-gray-800 pl-4 pr-11 py-2 text-sm outline-none"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                    isUploading
                      ? "text-gray-600 cursor-not-allowed"
                      : "hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  {isUploading ? "..." : "📎"}
                </button>
              </div>

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
