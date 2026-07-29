type ChatHeaderProps = {
  status: string;
  onlineUsers: number;
  onReport: () => void;
};

export default function ChatHeader({
  status,
  onlineUsers,
  onReport,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-gray-800 px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
      <h1 className="text-2xl font-bold">
        StrangerConnect
      </h1>

      <div className="flex items-center gap-4 text-sm sm:text-base">
        <div className="text-blue-400 font-medium">
          👥 {onlineUsers} online
        </div>

        <div
          className={`font-medium ${
            status === "Connected"
              ? "text-green-400"
              : status === "Searching..."
              ? "text-yellow-400"
              : "text-red-400"
          }`}
        >
          ● {status}
        </div>

        <button
          onClick={onReport}
          className="text-red-500 hover:text-red-400 text-lg transition"
          title="Report User"
        >
          🚩
        </button>
      </div>
    </header>
  );
}