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
  isUnread?: boolean;
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

export default function useFriends() {
  const [incomingRequest, setIncomingRequest] =
    useState<FriendRequestReceived | null>(null);

  const [requestNotice, setRequestNotice] = useState<string | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);

  const [activeFriendChat, setActiveFriendChat] =
    useState<ActiveFriendChat | null>(null);

  const [unreadFriendIds, setUnreadFriendIds] = useState<Set<string>>(
    new Set()
  );

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

      // Server already tells us who's unread as of the last time we
      // read anything (persisted), and already sorted by recent activity
      setUnreadFriendIds(
        new Set(list.filter((f) => f.isUnread).map((f) => f.userId))
      );
    });

    socket.on("friendRemoved", ({ friendUserId }: { friendUserId: string }) => {
      setFriends((prev) => prev.filter((f) => f.userId !== friendUserId));

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
          // Not currently viewing this conversation — flag it unread
          if (data.senderId) {
            setUnreadFriendIds((prevSet) => {
              if (prevSet.has(data.senderId)) return prevSet;
              const next = new Set(prevSet);
              next.add(data.senderId);
              return next;
            });
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
          setUnreadFriendIds((prevSet) => {
            if (prevSet.has(senderId)) return prevSet;
            const next = new Set(prevSet);
            next.add(senderId);
            return next;
          });
        }
      }
    );

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

  const openFriendChat = useCallback((friend: Friend) => {
    setUnreadFriendIds((prev) => {
      if (!prev.has(friend.userId)) return prev;
      const next = new Set(prev);
      next.delete(friend.userId);
      return next;
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
    unreadFriendIds,
    hasUnreadDMs: unreadFriendIds.size > 0,
    sendFriendRequest,
    respondToRequest,
    loadFriendsList,
    removeFriend,
    openFriendChat,
    sendFriendMessage,
    sendFriendFile,
    closeFriendChat,
  };
}
