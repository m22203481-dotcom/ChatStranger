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
  disabled={status !== "Connected"}
  className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
    status === "Connected"
      ? "bg-yellow-600 hover:bg-yellow-700"
      : "bg-gray-700 cursor-not-allowed text-gray-400"
  }`}
>
  Report
</button>
       
      </div>
    </header>
  );
}