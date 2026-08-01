import { useEffect, useRef } from "react";
import { socket } from "@/services/socket";
import { playMessageSound, playConnectSound } from "@/lib/sounds";

export type SocketIdentity =
  | { provider: "google"; email: string; name: string }
  | { provider: "anonymous"; token: string };

type UseSocketProps = {
  identity: SocketIdentity | null;
    profile: {
    name: string;
    image: string;
  };
  setStatus: (status: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setOnlineUsers: React.Dispatch<React.SetStateAction<number>>;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  setSharedTags: React.Dispatch<React.SetStateAction<string[]>>;
  setStrangerProfile: React.Dispatch<
  React.SetStateAction<{
    name: string;
    avatarUrl: string;
  } | null>
>;
  setStrangerUserId: React.Dispatch<React.SetStateAction<string | null>>;
  interests: string[];
};

export default function useSocket({
  identity,
  profile,
  setStatus,
  setMessages,
  setOnlineUsers,
  setIsTyping,
  setSharedTags,
  setStrangerProfile,
  setStrangerUserId,
  interests,
}: UseSocketProps): void {
  console.log("PROFILE RECEIVED:", profile);
  // console.log("PROFILE RECEIVED:", profile);
  // Keep a ref so the socket handlers always see the latest interests
  // without needing to re-run the connection effect
  const interestsRef = useRef(interests);
  const pendingReadIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    interestsRef.current = interests;
  }, [interests]);

  const identityKey = identity
    ? identity.provider === "google"
      ? `google:${identity.email}`
      : `anonymous:${identity.token}`
    : null;

  useEffect(() => {
    // Don't connect until we know who's connecting — this ensures the
    // server always gets identity info on the very first handshake,
    // needed for saving chat history to the right account
    if (!identity) {
      return;
    }

    socket.auth = identity;

    socket.connect();

    socket.onAny((event, ...args) => {
      console.log("EVENT:", event, args);
    });

   socket.once("connect", () => {
  console.log("✅ Connected:", socket.id);
  console.log("PROFILE IN CONNECT:", profile);

  socket.emit("setProfile", {
    name: profile?.name ?? "Anonymous",
    avatarUrl: profile?.image ?? "/default-avatar.png",
  });

  // Wait for the server to resolve our account before searching, so a
  // returning user can be matched back to their previous chat instead
  // of starting fresh. Falls back after a short timeout just in case
  // identity resolution is slow or unavailable.
  let searchStarted = false;

  const startSearch = () => {
    if (searchStarted) return;
    searchStarted = true;

    socket.emit("findStranger", {
      interests: interestsRef.current,
    });
  };

  socket.once("identityResolved", startSearch);
  setTimeout(startSearch, 3000);
}); 

    socket.on("waiting", () => {
      console.log("Waiting...");
      setStatus("Searching...");
    });

   socket.on("matched", (data) => {
  console.log("🔥 MATCHED EVENT FULL:", data);

  playConnectSound();

  pendingReadIdsRef.current.clear();
  setMessages([]);
  setSharedTags(data?.sharedTags ?? []);

  if (data?.stranger) {
    setStrangerProfile(data.stranger);
  }

  setStrangerUserId(data?.strangerUserId ?? null);

  setStatus("Connected");
});

    // I reconnected within the grace window — resume the SAME chat.
    // Deliberately does NOT clear messages/sharedTags like "matched"
    // does, since this isn't a new stranger
    socket.on("reconnected", (data) => {
      console.log("🔁 RESUMED OWN CHAT:", data);

      setSharedTags(data?.sharedTags ?? []);

      if (data?.stranger) {
        setStrangerProfile(data.stranger);
      }

      setStrangerUserId(data?.strangerUserId ?? null);

      setStatus("Connected");
    });

    // The stranger I was talking to came back within the grace window
    socket.on("strangerReconnected", (data) => {
      console.log("🔁 STRANGER RECONNECTED:", data);

      if (data?.stranger) {
        setStrangerProfile(data.stranger);
      }

      setStatus("Connected");
    });

    socket.on("onlineUsers", (count: number) => {
      setOnlineUsers(count);
    });

    socket.on("receiveMessage", (data: any) => {
      console.log("Received message:", data);

      playMessageSound();

      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          text: data.message,
          sender: "stranger",
          timestamp: Date.now(),
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileName: data.fileName,
        },
      ]);

      if (data?.id) {
        // Confirm the message actually arrived on this device
        socket.emit("messageDelivered", { id: data.id });

        // If the tab is visible right now, treat it as read immediately;
        // otherwise queue it for when the tab regains focus
        if (document.visibilityState === "visible") {
          socket.emit("messageRead", { id: data.id });
        } else {
          pendingReadIdsRef.current.add(data.id);
        }
      }
    });

    socket.on(
      "messageStatusUpdate",
      ({ id, status }: { id: string; status: "delivered" | "read" }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id && m.sender === "me" ? { ...m, status } : m
          )
        );
      }
    );

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        pendingReadIdsRef.current.size > 0
      ) {
        const ids = Array.from(pendingReadIdsRef.current);
        pendingReadIdsRef.current.clear();
        socket.emit("messageRead", { ids });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    socket.on("strangerTyping", () => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    });

    socket.on("strangerDisconnected", (stranger) => {
      setMessages([]);
      setSharedTags([]);
      if (stranger) {
  setStrangerProfile(stranger);
}
      setStatus("Stranger disconnected");
    });

    // Stranger clicked "Next" — show a brief message, then auto re-search
   socket.on("strangerSkipped", (stranger) => {
      console.log("STRANGER SKIPPED RECEIVED");
      setMessages([]);
      setSharedTags([]);
      if (stranger) {
  setStrangerProfile(stranger);
}
      setStatus("Stranger skipped this chat");

      setTimeout(() => {
        setStatus("Searching...");
        socket.emit("findStranger", { interests: interestsRef.current });
      }, 1500);
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socket.off();
      socket.disconnect();
    };
  }, [identityKey]);
}
