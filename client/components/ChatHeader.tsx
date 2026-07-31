type ChatHeaderProps = {
  status: string;
  onlineUsers: number;
  onReport: () => void;
  profile: {
    name: string;
    image: string;
    isGuest: boolean;
  };
  onProfileClick: () => void;
};



export default function ChatHeader({
  status,
  onlineUsers,
  onReport,
  profile,
  onProfileClick,
}: ChatHeaderProps) {
  return (
<header className="border-b border-gray-800 px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 min-h-[90px]">
    <h1 className="text-2xl font-bold">StrangerConnect</h1>

      <div className="flex items-center gap-4 text-sm sm:text-base">
        <div className="text-blue-400 font-medium">
          👥 {onlineUsers} online
        </div>

        <button
          onClick={onReport}
          disabled={status !== "Connected"}
          className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
            status === "Connected"
              ? "bg-yellow-600 hover:bg-yellow-700"
              : "bg-gray-700 opacity-50 cursor-not-allowed"
          }`}
        >
          Report
        </button>

      <button
  onClick={onProfileClick}
  className="flex flex-col items-center ml-2"
>
  <img
    src={profile.image || "/default-avatar.png"}
    alt="Profile"
    className="w-10 h-10 rounded-full border border-gray-700 hover:scale-110 transition"
  />

  <span className="text-xs text-gray-300 max-w-[100px] truncate">
    {profile.name}
  </span>

  {profile.isGuest && (
    <span className="text-[9px] bg-gray-700 text-gray-300 px-1 rounded mt-1">
      Guest
    </span>
  )}
</button> 
      </div>
    </header>
  );
}
