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
  onFriendsClick: () => void;
  hasUnreadDMs?: boolean;
};



export default function ChatHeader({
  status,
  onlineUsers,
  onReport,
  profile,
  onProfileClick,
  onFriendsClick,
  hasUnreadDMs,
}: ChatHeaderProps) {
  return (
<header className="border-b border-gray-800 px-4 py-4 flex flex-col gap-3 min-h-[90px]">
    <h1 className="text-2xl font-bold text-center">StrangerConnect</h1>

    <div className="flex items-center justify-between">
      <button
        onClick={onFriendsClick}
        className="relative px-3 py-1 rounded-full text-sm font-semibold bg-gray-800 hover:bg-gray-700 transition"
      >
        Friends
        {hasUnreadDMs && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse" />
        )}
      </button>

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
    </div>
    </header>
  );
}
