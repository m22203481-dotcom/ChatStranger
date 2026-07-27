
"use client";
import ChatMessages from "@/components/ChatMessages";
import ChatHeader from "@/components/ChatHeader";
import { useState, useRef, useEffect } from "react";
export default function ChatPage() {

    const [message, setMessage] = useState("");

const [messages, setMessages] = useState([
  { text: "Hi 👋", sender: "stranger" },
  { text: "Hello!", sender: "me" },
  { text: "Where are you from?", sender: "stranger" },
]);
const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
  bottomRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages]);
const sendMessage = () => {
if (!message.trim()) return;
setMessages((prev) => [
  ...prev,
  {
    text: message,
    sender: "me",
  },
]);
  setMessage("");
  setTimeout(() => {
  setMessages((prev) => [
    ...prev,
    {
      text: "Nice! I'm a stranger 👋",
      sender: "stranger",
    },
  ]);
}, 1000);
};
return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <ChatHeader status="Connected" />
      <ChatMessages messages={messages} />
      <div ref={bottomRef}></div>
      <footer className="border-t border-gray-800 p-4">
        <div className="flex gap-3">
          <input
  value={message}
  onChange={(e) => setMessage(e.target.value)}
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
          <button className="bg-red-600 hover:bg-red-700 px-6 rounded-full font-semibold">
            Next
          </button>
        </div>
      </footer>
    </main>
  );
}