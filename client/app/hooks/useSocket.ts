import { useEffect, useRef } from "react";
import { socket } from "@/services/socket";

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
  interests,
}: UseSocketProps): void {
  console.log("PROFILE RECEIVED:", profile);
  // console.log("PROFILE RECEIVED:", profile);
  // Keep a ref so the socket handlers always see the latest interests
  // without needing to re-run the connection effect
  const interestsRef = useRef(interests);

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

  socket.emit("findStranger", {
    interests: interestsRef.current,
  });
}); 

    socket.on("waiting", () => {
      console.log("Waiting...");
      setStatus("Searching...");
    });

   socket.on("matched", (data) => {
  console.log("🔥 MATCHED EVENT FULL:", data);

  setMessages([]);
  setSharedTags(data?.sharedTags ?? []);

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
      setMessages((prev) => [
        ...prev,
        {
          text: data.message,
          sender: "stranger",
          timestamp: Date.now(),
        },
      ]);
    });

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
      socket.off();
      socket.disconnect();
    };
  }, [identityKey]);
}
