import { useEffect, useRef } from "react";

export type Message = {
  text: string;
  sender: "me" | "stranger";
  timestamp: number;
};

type ChatMessagesProps = {
  messages: Message[];
};

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
          key={index}
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
              {msg.text}
            </div>

            <div className="text-xs text-gray-300 mt-2 text-right">
              {new Date(msg.timestamp).toLocaleTimeString(
                "en-GB",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </div>

          </div>

        </div>
      ))}

      <div ref={bottomRef} />

    </section>
  );
}