import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "@/services/socket";
import { playDmSound, playFriendRequestSound } from "@/lib/sounds";

export type FriendRequestReceived = {
  friendshipId: string;
  fromUserId: string;
  fromDisplayName: string;
  fromAvatarUrl: string;
};

export type Friend = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  isOnline?: boolean;
  isPremium?: boolean;
  unreadCount?: number;
  lastMessageAt?: number | null;
};

export type FriendMessage = {
  text?: string;
  sender: "me" | "friend";
  timestamp: number;
  fileUrl?: string;
  fileType?: "image" | "video" | "file";
  fileName?: string;
};

type ActiveFriendChat = {
  conversationId: string;
  roomName: string;
  friend: Friend;
  messages: FriendMessage[];
};

export default function useFriends({
  onMediaBlocked,
}: { onMediaBlocked?: () => void } = {}) {
  const [incomingRequest, setIncomingRequest] =
    useState<FriendRequestReceived | null>(null);

  const [requestNotice, setRequestNotice] = useState<string | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);

  const [activeFriendChat, setActiveFriendChat] =
    useState<ActiveFriendChat | null>(null);

  // userId -> number of unread messages from that friend
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Socket listeners are registered once (empty dep array below), so they
  // close over stale state if we read activeFriendChat directly. This ref
  // always has the current value.
  const activeFriendChatRef = useRef<ActiveFriendChat | null>(null);

  useEffect(() => {
    activeFriendChatRef.current = activeFriendChat;
  }, [activeFriendChat]);

  useEffect(() => {
    socket.on("friendRequestReceived", (data: FriendRequestReceived) => {
      playFriendRequestSound();
      setIncomingRequest(data);
    });

    socket.on("friendRequestSent", () => {
      setRequestNotice("Friend request sent!");
      setTimeout(() => setRequestNotice(null), 2500);
    });

    socket.on("friendRequestStatus", (data: any) => {
      if (data.alreadyExists) {
        setRequestNotice(
          data.status === "accepted"
            ? "You're already friends"
            : "Request already pending"
        );
        setTimeout(() => setRequestNotice(null), 2500);
        return;
      }

      if (data.status === "accepted") {
        setRequestNotice(
          `${data.otherUser?.displayName ?? "Someone"} accepted your friend request!`
        );
        setTimeout(() => setRequestNotice(null), 3000);
      }

      // Refresh the friends list whenever a request resolves
      socket.emit("getFriendsList");
    });

    socket.on("friendsList", (list: Friend[]) => {
      setFriends(list);

      // Server already tells us the real unread count as of the last
      // time we read anything (persisted), and already sorted by
      // recent activity
      const counts: Record<string, number> = {};
      list.forEach((f) => {
        if (f.unreadCount) counts[f.userId] = f.unreadCount;
      });
      setUnreadCounts(counts);
    });

    socket.on("friendRemoved", ({ friendUserId }: { friendUserId: string }) => {
      setFriends((prev) => prev.filter((f) => f.userId !== friendUserId));

      setUnreadCounts((prev) => {
        if (!(friendUserId in prev)) return prev;
        const { [friendUserId]: _removed, ...rest } = prev;
        return rest;
      });

      setActiveFriendChat((prev) =>
        prev?.friend.userId === friendUserId ? null : prev
      );
    });

    socket.on(
      "friendPresence",
      ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
        setFriends((prev) =>
          prev.map((f) =>
            f.userId === userId ? { ...f, isOnline } : f
          )
        );
      }
    );

    socket.on("friendChatOpened", (data: any) => {
      setActiveFriendChat((prev) => ({
        conversationId: data.conversationId,
        roomName: data.roomName,
        friend: prev?.friend ?? { userId: "", displayName: "", avatarUrl: "" },
        messages: data.messages.map((m: any) => ({
          text: m.text,
          sender: m.sender,
          timestamp: m.timestamp,
          fileUrl: m.fileUrl,
          fileType: m.fileType,
          fileName: m.fileName,
        })),
      }));
    });

    socket.on("receiveFriendMessage", (data: any) => {
      playDmSound();

      // Keep the list ordered by recent activity even when the chat is
      // already open (server won't send friendMessageNotification here)
      if (data.senderId) {
        setFriends((prev) => {
          const idx = prev.findIndex((f) => f.userId === data.senderId);
          if (idx <= 0) return prev;

          const friend = { ...prev[idx], lastMessageAt: data.timestamp };
          const rest = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
          return [friend, ...rest];
        });
      }

      setActiveFriendChat((prev) => {
        if (!prev || prev.conversationId !== data.conversationId) {
          // Not currently viewing this conversation — bump the count
          if (data.senderId) {
            setUnreadCounts((prevCounts) => ({
              ...prevCounts,
              [data.senderId]: (prevCounts[data.senderId] ?? 0) + 1,
            }));
          }

          return prev;
        }

        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              text: data.text,
              sender: "friend",
              timestamp: data.timestamp,
              fileUrl: data.fileUrl,
              fileType: data.fileType,
              fileName: data.fileName,
            },
          ],
        };
      });
    });

    // Fired for a friend's DM even when their chat isn't currently open,
    // so the badge + reorder work regardless of what's on screen
    socket.on(
      "friendMessageNotification",
      ({
        conversationId,
        senderId,
        timestamp,
      }: {
        conversationId: string;
        senderId: string;
        timestamp: number;
      }) => {
        playDmSound();

        setFriends((prev) => {
          const idx = prev.findIndex((f) => f.userId === senderId);
          if (idx === -1) return prev;

          const friend = { ...prev[idx], lastMessageAt: timestamp };
          const rest = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
          return [friend, ...rest];
        });

        const isCurrentlyOpen =
          activeFriendChatRef.current?.conversationId === conversationId;

        if (!isCurrentlyOpen) {
          setUnreadCounts((prevCounts) => ({
            ...prevCounts,
            [senderId]: (prevCounts[senderId] ?? 0) + 1,
          }));
        }
      }
    );

    socket.on("friendMediaBlocked", () => {
      onMediaBlocked?.();
    });

    return () => {
      socket.off("friendRequestReceived");
      socket.off("friendRequestSent");
      socket.off("friendRequestStatus");
      socket.off("friendsList");
      socket.off("friendRemoved");
      socket.off("friendPresence");
      socket.off("friendChatOpened");
      socket.off("receiveFriendMessage");
      socket.off("friendMessageNotification");
      socket.off("friendMediaBlocked");
    };
  }, []);

  const sendFriendRequest = useCallback(() => {
    socket.emit("sendFriendRequest");
  }, []);

  const respondToRequest = useCallback(
    (accept: boolean) => {
      if (!incomingRequest) return;

      socket.emit("respondFriendRequest", {
        friendshipId: incomingRequest.friendshipId,
        accept,
      });

      setIncomingRequest(null);
    },
    [incomingRequest]
  );

  const loadFriendsList = useCallback(() => {
    socket.emit("getFriendsList");
  }, []);

  const removeFriend = useCallback((friendUserId: string) => {
    socket.emit("removeFriend", { friendUserId });
  }, []);

  const blockFriend = useCallback((friendUserId: string) => {
    socket.emit("blockFriend", { friendUserId });
  }, []);

  const openFriendChat = useCallback((friend: Friend) => {
    setUnreadCounts((prev) => {
      if (!(friend.userId in prev)) return prev;
      const { [friend.userId]: _cleared, ...rest } = prev;
      return rest;
    });

    setActiveFriendChat({
      conversationId: "",
      roomName: "",
      friend,
      messages: [],
    });

    socket.emit("openFriendChat", { friendUserId: friend.userId });
  }, []);

  const sendFriendMessage = useCallback(
    (text: string) => {
      if (!activeFriendChat || !text.trim()) return;

      socket.emit("sendFriendMessage", {
        conversationId: activeFriendChat.conversationId,
        roomName: activeFriendChat.roomName,
        text,
      });

      setActiveFriendChat((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                { text, sender: "me", timestamp: Date.now() },
              ],
            }
          : prev
      );
    },
    [activeFriendChat]
  );

  const closeFriendChat = useCallback(() => {
    setActiveFriendChat(null);
  }, []);

  const sendFriendFile = useCallback(
    (uploaded: { url: string; type: "image" | "video" | "file"; name: string }) => {
      if (!activeFriendChat) return;

      socket.emit("sendFriendMessage", {
        conversationId: activeFriendChat.conversationId,
        roomName: activeFriendChat.roomName,
        fileUrl: uploaded.url,
        fileType: uploaded.type,
        fileName: uploaded.name,
      });

      setActiveFriendChat((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  sender: "me",
                  timestamp: Date.now(),
                  fileUrl: uploaded.url,
                  fileType: uploaded.type,
                  fileName: uploaded.name,
                },
              ],
            }
          : prev
      );
    },
    [activeFriendChat]
  );

  return {
    incomingRequest,
    requestNotice,
    friends,
    activeFriendChat,
    unreadCounts,
    hasUnreadDMs: Object.values(unreadCounts).some((c: number) => c > 0),
    sendFriendRequest,
    respondToRequest,
    loadFriendsList,
    removeFriend,
    blockFriend,
    openFriendChat,
    sendFriendMessage,
    sendFriendFile,
    closeFriendChat,
  };
}
