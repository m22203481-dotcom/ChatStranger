import { useEffect, useRef, useState } from "react";

export type Message = {
  id?: string;
  text?: string;
  sender: "me" | "stranger";
  timestamp: number;
  status?: "sent" | "delivered" | "read";
  fileUrl?: string;
  fileType?: "image" | "video" | "file";
  fileName?: string;
};

type ChatMessagesProps = {
  messages: Message[];
};

function MessageTicks({ status }: { status?: Message["status"] }) {
  if (!status) return null;

  const isRead = status === "read";
  const color = isRead ? "text-green-400" : "text-gray-400";

  if (status === "sent") {
    return <span className={`ml-1 ${color}`}>✓</span>;
  }

  return <span className={`ml-1 ${color}`}>✓✓</span>;
}

function MediaContent({ msg }: { msg: Message }) {
  // Own media is always shown clearly; incoming stranger media starts
  // blurred as a lightweight safety default against unsolicited content
  const [revealed, setRevealed] = useState(msg.sender === "me");

  if (!msg.fileUrl) return null;

  const needsBlur = msg.sender === "stranger" && !revealed;

  if (msg.fileType === "image") {
    return (
      <div className="relative inline-block">
        <img
          src={msg.fileUrl}
          alt={msg.fileName ?? "image"}
          className={`rounded-lg max-w-full max-h-64 object-cover transition ${
            needsBlur ? "blur-xl" : ""
          }`}
        />

        {needsBlur && (
          <button
            onClick={() => setRevealed(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg text-sm font-semibold"
          >
            Tap to view
          </button>
        )}
      </div>
    );
  }

  if (msg.fileType === "video") {
    if (needsBlur) {
      return (
        <button
          onClick={() => setRevealed(true)}
          className="w-56 h-40 flex flex-col items-center justify-center gap-2 bg-gray-900 rounded-lg text-sm font-semibold"
        >
          <span className="text-2xl">▶️</span>
          Tap to view video
        </button>
      );
    }

    return (
      <video
        src={msg.fileUrl}
        controls
        className="rounded-lg max-w-full max-h-64"
      />
    );
  }

  // Generic file
  return (
    <a
      href={msg.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 text-sm underline"
    >
      📎 {msg.fileName ?? "Download file"}
    </a>
  );
}

export default function ChatMessages({
  messages,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <section className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 min-h-0">

      {messages.map((msg, index) => (
        <div
          key={msg.id ?? index}
          className={`flex animate-in fade-in duration-300 ${
            msg.sender === "me"
              ? "justify-end"
              : "justify-start"
          }`}
        >

          <div
            className={`relative rounded-2xl px-4 py-3 max-w-[80%] sm:max-w-sm break-words shadow-lg ${
              msg.sender === "me"
                ? "bg-blue-600 rounded-br-md"
                : "bg-gray-800 rounded-bl-md"
            }`}
          >

            <div className="text-xs text-gray-300 mb-1">
              {msg.sender === "me"
                ? "You"
                : "Stranger"}
            </div>

            <div className="text-white">
              {msg.fileUrl ? <MediaContent msg={msg} /> : msg.text}
            </div>

            <div className="text-xs text-gray-300 mt-2 text-right flex items-center justify-end">
              {new Date(msg.timestamp).toLocaleTimeString(
                "en-GB",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}

              {msg.sender === "me" && (
                <MessageTicks status={msg.status} />
              )}
            </div>

          </div>

        </div>
      ))}

      <div ref={bottomRef} />

    </section>
  );
}
