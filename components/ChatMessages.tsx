type Message = {
  text: string;
  sender: "me" | "stranger";
};

type ChatMessagesProps = {
  messages: Message[];
};

export default function ChatMessages({
  messages,
}: ChatMessagesProps) {
  return (
    <section className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${
            msg.sender === "me"
              ? "justify-end"
              : "justify-start"
          }`}
        >
          <div
            className={`rounded-2xl px-5 py-3 max-w-sm ${
              msg.sender === "me"
                ? "bg-blue-600"
                : "bg-gray-800"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
    </section>
  );
}