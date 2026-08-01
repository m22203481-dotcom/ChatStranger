import { useEffect, useRef } from "react";

export type Message = {
  id?: string;
  text: string;
  sender: "me" | "stranger";
  timestamp: number;
  status?: "sent" | "delivered" | "read";
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

  // delivered or read both show double ticks — read just turns them green
  return <span className={`ml-1 ${color}`}>✓✓</span>;
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
              {msg.text}
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
