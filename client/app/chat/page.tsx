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
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll
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
  console.log("Send button clicked");
  if (!message.trim()) return;

  const newMessage = message;

  setMessages((prev) => [
    ...prev,
    {
  text: newMessage,
  sender: "me" as const,
  timestamp: Date.now(),
}
  ]);
console.log("Socket connected?", socket.connected);
console.log("Socket ID:", socket.id);
  socket.emit("sendMessage", newMessage);

  setMessage("");
};
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
     <ChatHeader
  status={status}
  onlineUsers={onlineUsers}
/>
<ChatMessages messages={messages} />

<div ref={bottomRef}></div>

{isTyping && (
  <div className="px-4 py-2 text-sm text-gray-400">
    Stranger is typing...
  </div>
)}

<footer className="border-t border-gray-800 p-4">
        <div className="flex gap-3">
          <input
            value={message}
          onChange={(e) => {
  setMessage(e.target.value);

  socket.emit("typing");

  clearTimeout((window as any).typingTimer);

  (window as any).typingTimer = setTimeout(() => {
    socket.emit("stopTyping");
  }, 1000);
}}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-gray-900 px-5 py-3 outline-none"
          />

          <button
  onClick={sendMessage}
  className="bg-blue-600 hover:bg-blue-700 px-6 rounded-full font-semibold"
>
  Send
</button>
<button
  onClick={() => {
    console.log("Next Stranger");

    socket.emit("nextStranger");

    setStatus("Searching...");
    setMessages([]);
  }}
  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full font-semibold"
>
  Next
</button>

        </div>
      </footer>
    </main>
  );
}