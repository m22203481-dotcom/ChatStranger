type ChatHeaderProps = {
  status: string;
  onlineUsers: number;
};

export default function ChatHeader({
  status,
  onlineUsers,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">StrangerConnect</h1>

      <div className="flex items-center gap-6">
        <div className="text-blue-400 font-medium">
          👥 {onlineUsers} online
        </div>

        <div
          className={`font-medium ${
            status === "Connected"
              ? "text-green-400"
              : "text-yellow-400"
          }`}
        >
          ● {status}
        </div>
      </div>
    </header>
  );
}