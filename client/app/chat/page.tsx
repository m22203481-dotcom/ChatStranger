"use client";

import { useState, useRef, useEffect } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages, {
  Message,
} from "@/components/ChatMessages";
import { socket } from "@/services/socket";
import useSocket from "@/app/hooks/useSocket";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Searching...");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const bottomRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useSocket({
    setStatus,
    setMessages,
    setOnlineUsers,
    setIsTyping,
  });

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = message;

    setMessages((prev) => [
      ...prev,
      {
        text: newMessage,
        sender: "me",
        timestamp: Date.now(),
      },
    ]);

    socket.emit(
      "sendMessage",
      newMessage
    );

    setMessage("");
  };

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <ChatHeader
        status={status}
        onlineUsers={onlineUsers}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <ChatMessages
          messages={messages}
        />

        <div ref={bottomRef}></div>

        {isTyping && (
          <div className="px-4 pb-2 text-sm text-gray-400">
            Stranger is typing...
          </div>
        )}
      </div>

      <footer className="border-t border-gray-800 p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <input
            value={message}
            onChange={(e) => {
              setMessage(
                e.target.value
              );

              socket.emit("typing");

              clearTimeout(
                (window as any)
                  .typingTimer
              );

              (
                window as any
              ).typingTimer =
                setTimeout(() => {
                  socket.emit(
                    "stopTyping"
                  );
                }, 1000);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-gray-900 px-4 py-3 outline-none"
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-full font-semibold whitespace-nowrap"
          >
            Send
          </button>

          <button
            onClick={() => {
              socket.emit(
                "nextStranger"
              );

              setStatus(
                "Searching..."
              );
              setMessages([]);
            }}
            className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-full font-semibold whitespace-nowrap"
          >
            Next
          </button>
          <button
  onClick={() => {

    socket.emit(
      "reportUser"
    );

    alert(
      "User reported"
    );

  }}
  className="bg-yellow-600 hover:bg-yellow-700 px-5 py-3 rounded-full font-semibold whitespace-nowrap"
>
  Report
</button>
        </div>
      </footer>
    </main>
  );
}