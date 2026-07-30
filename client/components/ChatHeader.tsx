type ChatHeaderProps = {
  status: string;
  onlineUsers: number;
  onReport: () => void;
  session: any;
  onProfileClick: () => void;
};
import Image from "next/image";
export default function ChatHeader({
  onlineUsers,
  onReport,
  session,
  onProfileClick,
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

        <button
          onClick={onReport}
          className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-600 hover:bg-yellow-700 transition"
        >
          Report
        </button>

        <button
  onClick={onProfileClick}
  className="flex flex-col items-center ml-2"
>
  <Image
  src={session?.user?.image || "/default-avatar.png"}
  alt="Profile"
  width={40}
  height={40}
  className="rounded-full border border-gray-700 hover:scale-110 transition"
/>

  <span className="text-xs text-gray-300 max-w-[100px] truncate">
    {session?.user?.name}
  </span>
</button>

      </div>
    </header>
  );
}