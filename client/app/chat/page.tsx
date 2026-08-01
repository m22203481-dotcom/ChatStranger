"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages, {
  Message,
} from "@/components/ChatMessages";
import FriendsPanel from "@/components/FriendsPanel";
import { socket } from "@/services/socket";
import useSocket, { SocketIdentity } from "@/app/hooks/useSocket";
import useFriends from "@/app/hooks/useFriends";
import { useAnonymousAuth } from "@/contexts/AnonymousAuthContext";

export default function ChatPage() {
  const { data: session, status: authStatus } = useSession();
  const { anonUser, isAnonLoading, logoutGuest } = useAnonymousAuth();

  const router = useRouter();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Searching...");
  const [showMatchFound, setShowMatchFound] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [confirmNext, setConfirmNext] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Interest-based matching
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [sharedTags, setSharedTags] = useState<string[]>([]);
  const [strangerProfile, setStrangerProfile] = useState<{
    name: string;
    avatarUrl: string;
  } | null>(null);
  const [strangerUserId, setStrangerUserId] = useState<string | null>(null);

  // Friends
  const [showFriendsPanel, setShowFriendsPanel] = useState(false);
  const friends = useFriends();

  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);


  const isAuthLoading = authStatus === "loading" || isAnonLoading;
  const isAuthenticated = !!session || !!anonUser;

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Unified profile — works whether signed in with Google or as a guest
  const profile = session
    ? {
        name: session.user?.name ?? "You",
        image: session.user?.image ?? "/default-avatar.png",
        isGuest: false,
      }
    : anonUser
    ? {
        name: anonUser.displayName,
        image: anonUser.avatarUrl,
        isGuest: true,
      }
    : { name: "", image: "/default-avatar.png", isGuest: false };

  // What the socket handshake identifies this connection as
  const identity: SocketIdentity | null = session?.user?.email
    ? {
        provider: "google",
        email: session.user.email,
        name: session.user.name ?? "",
      }
    : anonUser
    ? { provider: "anonymous", token: anonUser.token }
    : null;

  useSocket({
    identity,
    profile,
    setStatus: (newStatus) => {
      if (newStatus === "Connected") {
        setShowMatchFound(true);

        setTimeout(() => {
          setShowMatchFound(false);
        }, 1200);
      }

      setStatus(newStatus);
    },
    setMessages,
    setOnlineUsers,
    setIsTyping,
    setSharedTags,
    setStrangerProfile,
    setStrangerUserId,
    interests,
  });

  const strangerIsFriend = !!(
    strangerUserId && friends.friends.some((f) => f.userId === strangerUserId)
  );

  const addInterest = () => {
    const tag = interestInput.trim().toLowerCase();

    if (!tag) return;
    if (interests.includes(tag)) {
      setInterestInput("");
      return;
    }
    if (interests.length >= 5) return;

    setInterests((prev) => [...prev, tag]);
    setInterestInput("");
  };

  const removeInterest = (tag: string) => {
    setInterests((prev) => prev.filter((t) => t !== tag));
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const newMessage = message;

    setMessages((prev) => [
      ...prev,
      {
        id,
        text: newMessage,
        sender: "me",
        timestamp: Date.now(),
        status: "sent",
      },
    ]);

    socket.emit("sendMessage", { id, message: newMessage });

    setMessage("");
  };

  const handleNext = useCallback(() => {
    if (
      status !== "Connected" &&
      status !== "Stranger disconnected" &&
      status !== "Stranger skipped this chat"
    ) {
      return;
    }

    if (!confirmNext) {
      setConfirmNext(true);

      setTimeout(() => {
        setConfirmNext(false);
      }, 3000);

      return;
    }

    socket.emit("nextStranger");

    setStatus("Searching...");

    setMessages([]);
    setSharedTags([]);

    setConfirmNext(false);
  }, [confirmNext, status]);

  // ESC KEY FOR NEXT
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      handleNext();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [handleNext]);

  const handleLogout = () => {
    if (session) {
      signOut({ callbackUrl: "/login" });
    } else {
      logoutGuest();
      router.push("/login");
    }
  };

  const openFriendsPanel = () => {
    friends.loadFriendsList();
    setShowFriendsPanel(true);
  };

  if (isAuthLoading) {
    return (
      <main className="h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <ChatHeader
        status={status}
        onlineUsers={onlineUsers}
        onReport={() => {
          if (status === "Connected") {
            setShowReport(true);
          }
        }}
        profile={profile}
        onProfileClick={() => {
          friends.loadFriendsList();
          setShowProfileMenu(true);
        }}
        onFriendsClick={openFriendsPanel}
        hasUnreadDMs={friends.hasUnreadDMs}
      />

      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 && status === "Searching..." ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-6">🔍</div>

            <h2 className="text-2xl font-bold">
              Looking for someone to chat with
            </h2>

            <p className="mt-3 text-gray-400 max-w-md">
              We are finding a stranger for you.
             Stay here and your conversation will start soon.
            </p>

            {/* INTEREST TAGS INPUT */}
            <div className="mt-6 w-full max-w-sm">
              <div className="flex gap-2">
                <input
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                  placeholder="Add an interest (e.g. music)"
                  className="flex-1 rounded-full bg-gray-900 border border-gray-800 px-4 py-2 text-sm outline-none"
                />

                <button
                  onClick={addInterest}
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm font-semibold"
                >
                  Add
                </button>
              </div>

              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {interests.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-blue-900/40 text-blue-300 border border-blue-800 px-3 py-1 rounded-full text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => removeInterest(tag)}
                        className="text-blue-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3">
                We'll try to match you with someone who shares an
                interest. Leave this empty for a fully random match.
              </p>
            </div>
          </div>
        ) : messages.length === 0 && status === "Stranger skipped this chat" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          {strangerProfile && (
  <img
    src={strangerProfile.avatarUrl}
    alt={strangerProfile.name}
    className="w-24 h-24 rounded-full border border-gray-700 mb-6"
  />
)}

<h2 className="text-2xl font-bold">
  {strangerProfile?.name ?? "Someone"} skipped the chat
</h2>  

            <p className="mt-3 text-gray-400 max-w-md">
              Looking for someone new...
            </p>
          </div>
        ) : (
          <>
            {status === "Connected" && sharedTags.length > 0 && (
              <div className="px-4 py-2 text-center text-xs text-blue-300 bg-blue-900/20 border-b border-blue-900/40">
                You both like: {sharedTags.join(", ")}
              </div>
            )}

            <ChatMessages messages={messages} />
          </>
        )}

      {isTyping && strangerProfile && (
  <div className="px-4 pb-2 flex items-center gap-3">
    
    <img
      src={strangerProfile.avatarUrl}
      alt={strangerProfile.name}
      className="w-8 h-8 rounded-full border border-gray-700"
    />

    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span>{strangerProfile.name} is typing</span>

      <div className="flex gap-1">
        <span className="animate-bounce">●</span>
        <span className="animate-bounce [animation-delay:150ms]">●</span>
        <span className="animate-bounce [animation-delay:300ms]">●</span>
      </div>
    </div>
  </div>
)}  
        <div className="px-4 pb-2 text-sm font-medium">
         {status === "Connected" && strangerProfile && (
  <div className="flex items-center gap-3">
    <img
      src={strangerProfile.avatarUrl}
      alt={strangerProfile.name}
      className="w-8 h-8 rounded-full border border-gray-700"
    />

    <div className="flex flex-col">
      <span className="text-white text-sm font-semibold">
        {strangerProfile.name}
      </span>

      <span className="text-green-400 text-xs flex items-center gap-1">
        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        Online
      </span>
    </div>

    <button
      onClick={() => {
        if (!strangerUserId) return;

        if (strangerIsFriend) {
          friends.removeFriend(strangerUserId);
        } else {
          friends.sendFriendRequest();
        }
      }}
      disabled={!strangerUserId}
      className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
        !strangerUserId
          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
          : strangerIsFriend
          ? "bg-red-900/60 hover:bg-red-900 text-red-200"
          : "bg-green-700 hover:bg-green-600"
      }`}
    >
      {strangerIsFriend ? "Unfriend" : "+ Friend"}
    </button>
  </div>
)} 

          {status === "Searching..." && (
            <div className="flex items-center gap-2 text-yellow-400">
              <span>🔍 Searching for stranger...</span>

              <span className="flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce [animation-delay:150ms]">●</span>
                <span className="animate-bounce [animation-delay:300ms]">●</span>
              </span>
            </div>
          )}

        {status === "Stranger disconnected" && strangerProfile && (
  <div className="flex items-center gap-2 text-red-400">
    <img
      src={strangerProfile.avatarUrl}
      alt={strangerProfile.name}
      className="w-8 h-8 rounded-full"
    />

    <span>
      {strangerProfile.name} disconnected
    </span>
  </div>
)}  

 {status === "Stranger skipped this chat" && strangerProfile && (
  <div className="flex items-center gap-2 text-orange-400">
    <img
      src={strangerProfile.avatarUrl}
      alt={strangerProfile.name}
      className="w-8 h-8 rounded-full"
    />

    <span>
      {strangerProfile.name} skipped this chat
    </span>
  </div>
)}         
        </div>
      </div>

      {showProfileMenu && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-80 border border-gray-800 relative flex flex-col min-h-[420px]">
            <button
              onClick={() => setShowProfileMenu(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>

            <div className="flex flex-col items-center mb-6">
              <img
                src={profile.image}
                alt="Profile"
                className="w-20 h-20 rounded-full border border-gray-700 mb-3"
              />

              <h2 className="font-bold text-lg flex items-center gap-2">
                {profile.name}
                {profile.isGuest && (
                  <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                    Guest
                  </span>
                )}
              </h2>

              {session?.user?.email && (
                <p className="text-sm text-gray-400 text-center break-all">
                  {session.user.email}
                </p>
              )}

              {profile.isGuest && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  Your identity is saved to this browser only
                </p>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-xl mt-4 font-semibold"
            >
              {profile.isGuest ? "End Guest Session" : "Logout"}
            </button>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-80">
            <h2 className="text-xl font-bold mb-4">Report User</h2>

            <div className="space-y-3">
              {["Spam", "Harassment", "Inappropriate Content", "Other"].map(
                (reason) => (
                  <label key={reason} className="flex gap-3 items-center">
                    <input
                      type="radio"
                      name="report"
                      value={reason}
                      onChange={() => setReportReason(reason)}
                    />

                    {reason}
                  </label>
                )
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowReport(false);
                  setReportReason("");
                }}
                className="flex-1 bg-gray-700 rounded-full py-2"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (!reportReason) return;

                  socket.emit("reportUser", {
                    reason: reportReason,
                  });

                  setShowReport(false);
                  setReportReason("");
                }}
                className="flex-1 bg-yellow-600 rounded-full py-2"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

     {showMatchFound && strangerProfile && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 flex flex-col items-center animate-pulse">
      <div className="text-4xl mb-4">✨</div>

      <h2 className="text-2xl font-bold text-white mb-4">
        Match Found
      </h2>

      <img
        src={strangerProfile.avatarUrl}
        alt={strangerProfile.name}
        className="w-24 h-24 rounded-full border-2 border-green-500 mb-4"
      />

      <div className="text-lg font-semibold text-white">
        {strangerProfile.name}
      </div>

      <div className="text-green-400 mt-2 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        Connecting...
      </div>
    </div>
  </div>
)} 

      {/* INCOMING FRIEND REQUEST */}
      {friends.incomingRequest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-80 text-center border border-gray-800">
            <img
              src={friends.incomingRequest.fromAvatarUrl}
              alt={friends.incomingRequest.fromDisplayName}
              className="w-16 h-16 rounded-full mx-auto mb-3"
            />

            <h2 className="font-bold text-lg">
              {friends.incomingRequest.fromDisplayName}
            </h2>

            <p className="text-gray-400 text-sm mt-1">
              wants to add you as a friend
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => friends.respondToRequest(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-full py-2"
              >
                Decline
              </button>

              <button
                onClick={() => friends.respondToRequest(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-full py-2"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FRIEND REQUEST TOAST */}
      {friends.requestNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 px-4 py-2 rounded-full text-sm z-50 shadow-lg">
          {friends.requestNotice}
        </div>
      )}

      <FriendsPanel
        isOpen={showFriendsPanel}
        onClose={() => {
          setShowFriendsPanel(false);
          friends.closeFriendChat();
        }}
        friends={friends.friends}
        activeFriendChat={friends.activeFriendChat}
        onOpenChat={friends.openFriendChat}
        onSendMessage={friends.sendFriendMessage}
        onCloseChat={friends.closeFriendChat}
        unreadFriendIds={friends.unreadFriendIds}
      />

      <footer className="border-t border-gray-800 p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          {/* NEXT BUTTON */}
          <button
            onClick={handleNext}
            className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap"
          >
            {confirmNext ? "Confirm" : "Next"}
          </button>

          {/* MESSAGE INPUT */}
          <input
            disabled={status !== "Connected"}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);

              socket.emit("typing");

              clearTimeout((window as any).typingTimer);

              (window as any).typingTimer = setTimeout(() => {
                socket.emit("stopTyping");
              }, 2000);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && status === "Connected") {
                sendMessage();
              }
            }}
            placeholder={
              status === "Connected"
                ? "Type a message..."
                : "Waiting for stranger..."
            }
            className="flex-1 rounded-full bg-gray-900 px-4 py-3 outline-none"
          />

          {/* SEND BUTTON */}
          <button
            onClick={sendMessage}
            disabled={status !== "Connected"}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
              status === "Connected"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-700 cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </div>
      </footer>
    </main>
  );
}
