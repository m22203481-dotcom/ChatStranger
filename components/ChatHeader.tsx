type ChatHeaderProps = {
  status: string;
};

export default function ChatHeader({ status }: ChatHeaderProps) {
  return (
    <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">StrangerConnect</h1>

      <div
        className={`font-medium ${
          status === "Connected"
            ? "text-green-400"
            : "text-yellow-400"
        }`}
      >
        ● {status}
      </div>
    </header>
  );
}