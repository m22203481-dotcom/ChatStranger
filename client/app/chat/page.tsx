"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages, {
  Message,
} from "@/components/ChatMessages";
import FriendsPanel from "@/components/FriendsPanel";
import { socket } from "@/services/socket";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import { generateId } from "@/lib/generateId";
import useSocket, { SocketIdentity } from "@/app/hooks/useSocket";
import useFriends from "@/app/hooks/useFriends";
import { useAnonymousAuth } from "@/contexts/AnonymousAuthContext";
import { useTheme } from "@/contexts/ThemeContext";

type ChatHistoryItem = {
  userId: string;
  name: string;
  avatarUrl: string;
  isPremium?: boolean;
  timestamp: number;
};

// Used by the onboarding screen's country select
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium",
  "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria", "Cambodia",
  "Cameroon", "Canada", "Chile", "China", "Colombia", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Ecuador",
  "Egypt", "El Salvador", "Estonia", "Ethiopia", "Finland", "France",
  "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Honduras",
  "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kuwait", "Latvia", "Lebanon", "Libya", "Lithuania",
  "Luxembourg", "Malaysia", "Mexico", "Moldova", "Monaco", "Mongolia",
  "Morocco", "Myanmar", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Panama",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Saudi Arabia", "Serbia", "Singapore", "Slovakia",
  "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka",
  "Sweden", "Switzerland", "Taiwan", "Tanzania", "Thailand", "Tunisia",
  "Turkey", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe", "Other",
];

export default function ChatPage() {
  const { data: session, status: authStatus } = useSession();
  const { anonUser, isAnonLoading, logoutGuest } = useAnonymousAuth();
  const { isDark, toggleTheme } = useTheme();
  const [firstMessageTracked, setFirstMessageTracked] = useState(false);
  
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [historyProfile, setHistoryProfile] = useState<ChatHistoryItem | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [status, setStatus] = useState("Searching...");
  const [showMatchFound, setShowMatchFound] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportUserId, setReportUserId] = useState<string | null>(null);
  const [confirmNext, setConfirmNext] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
  try {
    const saved = localStorage.getItem("chatstranger_history");

    if (saved) {
      setChatHistory(JSON.parse(saved));
    }
  } catch (error) {
    console.error("Failed to load chat history:", error);
  }
}, []);
   useEffect(() => {
  if (!showEmojiPicker) return;

  const handleOutsideClick = (event: PointerEvent) => {
    const target = event.target as Node;

    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current.contains(target)
    ) {
      setShowEmojiPicker(false);
    }
  };

  document.addEventListener("pointerdown", handleOutsideClick);

  return () => {
    document.removeEventListener("pointerdown", handleOutsideClick);
  };
}, [showEmojiPicker]);

  // Interest-based matching
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [sharedTags, setSharedTags] = useState<string[]>([]);
  const [strangerProfile, setStrangerProfile] = useState<{
    name: string;
    avatarUrl: string;
    isPremium?: boolean;
  } | null>(null);
  const [strangerUserId, setStrangerUserId] = useState<string | null>(null);
  useEffect(() => {
  if (
    status !== "Connected" ||
    !strangerUserId ||
    !strangerProfile
  ) {
    return;
  }

  setChatHistory((prev) => {
    const existing = prev.find(
      (item) => item.userId === strangerUserId
    );

    // Don't add the same stranger repeatedly
    if (existing) {
      return prev;
    }

    const newHistoryItem: ChatHistoryItem = {
      userId: strangerUserId,
      name: strangerProfile.name,
      avatarUrl: strangerProfile.avatarUrl,
      isPremium: strangerProfile.isPremium,
      timestamp: Date.now(),
    };

    const updated = [newHistoryItem, ...prev].slice(0, 50);

    localStorage.setItem(
      "chatstranger_history",
      JSON.stringify(updated)
    );

    return updated;
  });
}, [status, strangerUserId, strangerProfile]);
  // Onboarding gate — shown once, right after login (guest or Google),
  // before any matching happens. null = not determined yet (still
  // waiting on identityResolved), true = still needs to fill it in,
  // false = already done (skip straight to searching).
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [onboardingGender, setOnboardingGender] = useState<string | null>(null);
  const [onboardingCountry, setOnboardingCountry] = useState("");
  const [onboardingAge, setOnboardingAge] = useState("");
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [ageConsent, setAgeConsent] = useState(false);
  // Premium features
  const [isPremium, setIsPremium] = useState(false);
  const [genderPreference, setGenderPreference] = useState<string[]>([]);
  const [premiumNotice, setPremiumNotice] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showBlockedUsersModal, setShowBlockedUsersModal] = useState(false);
  const [showStrangerMenu, setShowStrangerMenu] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<
    { userId: string; displayName: string; avatarUrl: string; isPremium?: boolean }[]
  >([]);

  // Friends
  const [showFriendsPanel, setShowFriendsPanel] = useState(false);
  const friends = useFriends({
    onMediaBlocked: () => setShowPremiumModal(true),
  });

  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);


  const isAuthLoading = authStatus === "loading" || isAnonLoading;
  const isAuthenticated = !!session || !!anonUser;

  // Guests already have isPremium on their resolved anonUser; Google
  // users get it slightly later via the socket's identityResolved event
  // (see setIsPremium passed into useSocket below)
  useEffect(() => {
    if (anonUser) {
      setIsPremium(Boolean(anonUser.isPremium));
    }
  }, [anonUser]);

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
        isPremium,
      }
    : anonUser
    ? {
        name: anonUser.displayName,
        image: anonUser.avatarUrl,
        isGuest: true,
        isPremium,
      }
    : { name: "", image: "/default-avatar.png", isGuest: false, isPremium: false };

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

  const { startSearch } = useSocket({
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
    genderPreference,
    setIsPremium,
    onMediaBlocked: () => {
      setPremiumNotice("Sending photos/videos is a premium feature.");
      setTimeout(() => setPremiumNotice(null), 3000);
    },
    onUndoUnavailable: (reason) => {
      const messages: Record<string, string> = {
        premium_required: "Undo is a premium feature.",
        expired: "Too late to undo that skip.",
        partner_unavailable: "That stranger is no longer available.",
      };
      setPremiumNotice(messages[reason] ?? "Couldn't undo that skip.");
      setTimeout(() => setPremiumNotice(null), 3000);
    },
    onIdentityResolved: (data) => {
      if (data.gender && data.country && data.age) {
        // Already onboarded (returning user) — go straight to searching
        setNeedsOnboarding(false);
        startSearch();
      } else {
        setNeedsOnboarding(true);
      }
    },
  });

  const strangerIsFriend = !!(
    strangerUserId && friends.friends.some((f) => f.userId === strangerUserId)
  );
const addToChatHistory = () => {
  if (!strangerUserId || !strangerProfile) return;

  const historyItem: ChatHistoryItem = {
    userId: strangerUserId,
    name: strangerProfile.name || "Stranger",
    avatarUrl: strangerProfile.avatarUrl || "/default-avatar.png",
    isPremium: strangerProfile.isPremium,
    timestamp: Date.now(),
  };

  setChatHistory((prev) => {
    const filtered = prev.filter(
      (item) => item.userId !== historyItem.userId
    );

    return [historyItem, ...filtered].slice(0, 50);
  });
};
  const addInterest = () => {
   const tag =
  interestInput.trim().charAt(0).toUpperCase() +
  interestInput.trim().slice(1); 

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

  const toggleGenderPreference = (gender: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setGenderPreference((prev) =>
      prev.includes(gender)
        ? prev.filter((g) => g !== gender)
        : [...prev, gender]
    );
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    
    if (
    !firstMessageTracked &&
    typeof window !== "undefined" &&
    (window as any).gtag
  ) {
    (window as any).gtag("event", "first_message_sent");
    setFirstMessageTracked(true);
  }

    const id = generateId();

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
 const handleEmojiClick = (emojiData: EmojiClickData) => {
  setMessage((prev) => prev + emojiData.emoji);
  setShowEmojiPicker(false);
};
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    e.target.value = ""; // allow selecting the same file again later

    if (!file || status !== "Connected") return;

    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setIsUploading(true);

    try {
      const uploaded = await uploadToCloudinary(file);
      const id = generateId();

      setMessages((prev) => [
        ...prev,
        {
          id,
          sender: "me",
          timestamp: Date.now(),
          status: "sent",
          fileUrl: uploaded.url,
          fileType: uploaded.type,
          fileName: uploaded.name,
        },
      ]);

      socket.emit("sendMessage", {
        id,
        fileUrl: uploaded.url,
        fileType: uploaded.type,
        fileName: uploaded.name,
      });

    } catch (error: any) {
      alert(error?.message || "Upload failed — please try again");
    } finally {
      setIsUploading(false);
    }
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

    addToChatHistory();

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

  // BLOCKING — listens for confirmation that a block went through (ends
  // the current chat and auto-searches, handled server-side), plus the
  // Blocked Users list itself
  useEffect(() => {
    const handleUserBlocked = () => {
      setStrangerProfile(null);
      setStrangerUserId(null);
      setMessages([]);
      setSharedTags([]);
      setStatus("Searching...");
      setShowStrangerMenu(false);
    };
   

    const handleBlockedUsersList = (
      list: { userId: string; displayName: string; avatarUrl: string; isPremium?: boolean }[]
    ) => {
      setBlockedUsers(list);
    };

    const handleUserUnblocked = ({ blockedUserId }: { blockedUserId: string }) => {
      setBlockedUsers((prev) => prev.filter((u) => u.userId !== blockedUserId));
    };

    socket.on("userBlocked", handleUserBlocked);
    socket.on("blockedUsersList", handleBlockedUsersList);
    socket.on("userUnblocked", handleUserUnblocked);

    return () => {
      socket.off("userBlocked", handleUserBlocked);
      socket.off("blockedUsersList", handleBlockedUsersList);
      socket.off("userUnblocked", handleUserUnblocked);
    };
  }, []);

  const handleLogout = () => {
    if (session) {
      signOut({ callbackUrl: "/login" });
    } else {
      // Don't push("/login") here — the effect above already redirects
      // to /login as soon as isAuthenticated goes false. Navigating
      // manually too raced against logoutGuest()'s state update (which
      // hasn't necessarily committed yet), causing flicker/inconsistent
      // landing behavior.
      logoutGuest();
    }
  };

  const handleUndoSkip = () => {
    if (!isPremium) return;
    socket.emit("undoSkip");
  };

  // Dev-only: flip isPremium for testing without a real payment flow.
  // The server itself no-ops this outside development, so it's harmless
  // to leave the button in place.
  const handleDevTogglePremium = () => {
    socket.emit("devTogglePremium");
  };

  const openFriendsPanel = () => {
    friends.loadFriendsList();
    setShowFriendsPanel(true);
  };

  const handleCompleteOnboarding = () => {
    setOnboardingError(null);

    const age = Number(onboardingAge);

    if (!onboardingGender) {
      setOnboardingError("Please select a gender.");
      return;
    }

    if (!onboardingCountry) {
      setOnboardingError("Please select a country.");
      return;
    }

    if (!Number.isFinite(age) || age < 13 || age > 100) {
      setOnboardingError("Please enter a valid age (13-100).");
      return;
    }

    socket.emit("completeOnboarding", {
      gender: onboardingGender,
      country: onboardingCountry,
      age,
    });

    setNeedsOnboarding(false);
    startSearch();
  };

  if (isAuthLoading) {
    return (
      <main className={`h-dvh flex items-center justify-center ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
        Loading...
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // ONBOARDING GATE — shown once right after login (guest or Google),
  // before the person ever sees the search/chat UI. needsOnboarding is
  // null until identityResolved reports back; true means gender/country/
  // age aren't saved yet.
  if (needsOnboarding === null) {
    return (
      <main className={`h-dvh flex items-center justify-center ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
        Loading...
      </main>
    );
  }

  if (needsOnboarding) {
    return (
      <main
        className={`relative min-h-dvh overflow-hidden flex items-center justify-center px-4 sm:px-6 transition-colors duration-300 ${
          isDark
            ? "bg-gradient-to-b from-black via-gray-900 to-black text-white"
            : "bg-gradient-to-b from-white via-gray-100 to-white text-black"
        }`}
      >
        <div
          className={`relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 text-center border shadow-2xl ${
            isDark ? "bg-gray-900/80 border-gray-800" : "bg-white/90 border-gray-200"
          }`}
        >
          <h1 className="text-3xl font-extrabold">Tell us about yourself</h1>

          <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            This helps us match you better.
          </p>

          {/* GENDER */}
          <p className="text-sm font-semibold mt-6 mb-2 text-left">Gender</p>
          <div className="flex gap-2">
            {["male", "female", "other"].map((g) => (
              <button
                key={g}
                onClick={() => setOnboardingGender(g)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize border transition ${
                  onboardingGender === g
                    ? "bg-blue-600 border-blue-500 text-white"
                    : isDark
                    ? "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                    : "bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* COUNTRY */}
          <p className="text-sm font-semibold mt-6 mb-2 text-left">Country</p>
          <select
            value={onboardingCountry}
            onChange={(e) => setOnboardingCountry(e.target.value)}
            className={`w-full rounded-xl border px-4 py-2.5 text-base outline-none ${
              isDark
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-gray-100 border-gray-300 text-black"
            }`}
          >
            <option value="">Select your country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

        {/* AGE */}
<p className="text-sm font-semibold mt-6 mb-2 text-left">Age</p>

<input
  type="number"
  min={18}
  max={100}
  value={onboardingAge}
  onChange={(e) => {
    setOnboardingAge(e.target.value);

    // Reset consent if age is changed below 18
    if (Number(e.target.value) < 18) {
      setAgeConsent(false);
    }
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter" && ageConsent) {
      handleCompleteOnboarding();
    }
  }}
  placeholder="Your age"
  className={`w-full rounded-xl border px-4 py-2.5 text-base outline-none ${
    isDark
      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
      : "bg-gray-100 border-gray-300 text-black placeholder-gray-400"
  }`}
/>

{/* AGE CONSENT */}
<div className="mt-4 text-left">
  <div className="flex items-start gap-3 text-sm">
    <button
      type="button"
      onClick={() => {
        if (Number(onboardingAge) < 18) {
          setOnboardingError("You must be 18 or older to use ChatStranger.");
          return;
        }

        setAgeConsent((prev) => !prev);
        setOnboardingError("");
      }}
      className={`mt-1 h-6 w-6 shrink-0 rounded-md border flex items-center justify-center text-base ${
        ageConsent
          ? "bg-blue-600 border-blue-600 text-white"
          : isDark
          ? "border-gray-600 bg-gray-800"
          : "border-gray-400 bg-white"
      }`}
      aria-label="Confirm you are 18 years old"
    >
      {ageConsent && "✓"}
    </button>

    <div
      className={`leading-5 ${
        isDark ? "text-gray-300" : "text-gray-700"
      }`}
    >
      I confirm that I am{" "}
      <button
        type="button"
        onClick={() => {
          if (Number(onboardingAge) < 18) {
            setOnboardingError(
              "You must be 18 or older to use ChatStranger."
            );
            return;
          }

          setAgeConsent((prev) => !prev);
          setOnboardingError("");
        }}
        className="font-semibold underline"
      >
        18 years old
      </button>{" "}
      and agree to the{" "}
      <a
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline"
      >
        Terms of Service
      </a>{" "}
      and{" "}
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline"
      >
        Privacy Policy
      </a>
      .
    </div>
  </div>

  {Number(onboardingAge) > 0 && Number(onboardingAge) < 18 && (
    <p className="mt-2 text-sm text-red-500">
      You must be 18 or older to use ChatStranger.
    </p>
  )}
</div>

          {onboardingError && (
            <p className="text-red-400 text-sm mt-3">{onboardingError}</p>
          )}

        <button
  onClick={handleCompleteOnboarding}
  disabled={!ageConsent}
  className={`w-full mt-8 font-semibold py-3.5 rounded-xl transition ${
    ageConsent
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : isDark
      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
      : "bg-gray-200 text-gray-400 cursor-not-allowed"
  }`}
>
  Get Started →
</button>
        </div>
      </main>
    );
  }

  return (
    <main className={`h-dvh flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
      <ChatHeader
        status={status}
        profile={profile}
        onProfileClick={() => {
          friends.loadFriendsList();
          setShowProfileMenu(true);
        }}
        onFriendsClick={openFriendsPanel}
        onHistoryClick={() => setShowHistory(true)} 
        hasUnreadDMs={friends.hasUnreadDMs}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onGoHome={() => router.push("/")}
        onBuyPremium={() => setShowPremiumModal(true)}
      />

      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 && status === "Searching..." ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-6">🔍</div>

            <h2 className="text-2xl font-bold">
              Looking for someone....
            </h2>

            <p className="mt-3 text-gray-400 max-w-md">
             Stay here and your conversation will start soon.
            </p>

            {/* INTEREST TAGS INPUT */}
            <div className="mt-6 w-full max-w-sm">
            <div
  className={`flex items-center gap-2 rounded-2xl border p-2 ${
    isDark
      ? "bg-gray-900 border-gray-800"
      : "bg-white border-gray-200 shadow-sm"
  }`}
>  
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
                 className={`flex-1 bg-transparent px-3 py-2 outline-none ${
  isDark
    ? "text-white placeholder-gray-500"
    : "text-gray-900 placeholder-gray-400"
}`} 
                />

                <button
                  onClick={addInterest}
                 className={`px-5 py-2 rounded-xl font-semibold transition ${
  isDark
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-blue-500 hover:bg-blue-600 text-white"
}`} 
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

              <p className="text-xs text-gray-400 mt-3">
                Leave this empty for random match.
              </p>
            </div>

            {/* GENDER FILTER (premium only) */}
            <div className="mt-8 w-full max-w-sm">
              <p className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
                Match me with:
                {!isPremium && <span title="Premium feature">🔒</span>}
              </p>
             <div className="grid grid-cols-3 gap-3 mt-4">
  {[
    { label: "male", icon: "👨" },
    { label: "female", icon: "👩" },
    { label: "other", icon: "🌈" },
  ].map(({ label, icon }) => (
    <button
      key={label}
      onClick={() => toggleGenderPreference(label)}
      className={`h-12 rounded-xl border font-medium transition-all ${
        isPremium && genderPreference.includes(label)
          ? "bg-blue-600 text-white border-blue-600"
          : isDark
          ? "bg-gray-900 border-gray-800 text-gray-300"
          : "bg-white border-gray-200 text-gray-700 hover:border-blue-400"
      }`}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  ))}
</div> 
              <p className="text-xs text-gray-500 mt-2 text-center">
                {isPremium
                  ? "Leave all unselected to match with anyone."
                  : "Tap any option to unlock gender filtering."}
              </p>

              {/* PRIORITY MATCH indicator */}
              <button
                onClick={() => !isPremium && setShowPremiumModal(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-gray-500"
              >
                {isPremium ? (
                  <span className="text-green-400">
                    ⭐ Priority Match active — you're matched first
                  </span>
                ) : (
                  <span className="hover:text-gray-300">
                    ⭐ Priority Match 🔒 — get matched faster
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : messages.length === 0 && status === "Stranger skipped this chat" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          {strangerProfile && (
  <img

    referrerPolicy="no-referrer"
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

    
      referrerPolicy="no-referrer"
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
  <div className="relative flex items-center gap-3">
    <button
      onClick={() => setShowStrangerMenu((prev) => !prev)}
      className="relative flex items-center gap-3 shrink-0"
      aria-label="Stranger options"
      aria-expanded={showStrangerMenu}
    >
      <div className="relative shrink-0">
        <img

          referrerPolicy="no-referrer"
          src={strangerProfile.avatarUrl}
          alt={strangerProfile.name}
          className={`w-8 h-8 rounded-full border hover:scale-110 transition ${isDark ? "border-gray-700" : "border-gray-300"}`}
        />

        {strangerProfile.isPremium && (
          <span className="absolute -top-1 -right-1 text-xs" title="Premium">
            👑
          </span>
        )}
      </div>

      <div className="flex flex-col items-start">
        <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
          {strangerProfile.name}
        </span>

        <span className="text-green-400 text-xs flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          Online
        </span>
      </div>
    </button>

    {/* Click-outside backdrop */}
    {showStrangerMenu && (
      <div className="fixed inset-0 z-30" onClick={() => setShowStrangerMenu(false)} />
    )}

    {/* DROPDOWN — drops UP from the stranger's avatar (this row sits
        right below the header, so opening downward would crowd the
        message list; opening up uses the space under the header) */}
    {showStrangerMenu && (
      <div
        className={`absolute left-0 bottom-full mb-2 w-48 rounded-2xl border overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
          isDark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200 shadow-xl"
        }`}
      >
        <button
          onClick={() => {
            if (!strangerUserId) return;
            if (strangerIsFriend) {
              friends.removeFriend(strangerUserId);
            } else {
              friends.sendFriendRequest();
            }
            setShowStrangerMenu(false);
          }}
          disabled={!strangerUserId}
          className={`w-full text-left flex items-center gap-2 px-4 py-3 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
            isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
          }`}
        >
          {strangerIsFriend ? "💔 Remove Friend" : "➕ Add Friend"}
        </button>

        <button
  onClick={() => {
    socket.emit("blockUser");
    setShowStrangerMenu(false);
  }}
  className={`w-full text-left flex items-center gap-2 px-4 py-3 text-sm font-medium border-t transition text-red-400 ${
    isDark
      ? "border-gray-800 hover:bg-gray-800"
      : "border-gray-200 hover:bg-gray-100"
  }`}
>
  🚫 Block
</button>

<button
  onClick={() => {
    setShowStrangerMenu(false);
    setReportReason("");
    setShowReport(true);
  }}
  className={`w-full text-left flex items-center gap-2 px-4 py-3 text-sm font-medium border-t transition text-yellow-500 ${
    isDark
      ? "border-gray-800 hover:bg-gray-800"
      : "border-gray-200 hover:bg-gray-100"
  }`}
>
  ⚠️ Report
</button>
      </div>
    )}
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

      referrerPolicy="no-referrer"
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

      referrerPolicy="no-referrer"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
         <div
  className={`rounded-2xl p-6 w-full max-w-xs relative flex flex-col min-h-[420px] ${
    isDark
      ? "bg-gray-900 border border-gray-800 text-white"
      : "bg-white border border-gray-200 text-black shadow-xl"
  }`}
> 
            <button
              onClick={() => setShowProfileMenu(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>

            <div className="flex flex-col items-center mb-6">
              <img

                referrerPolicy="no-referrer"
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
              onClick={() => {
                socket.emit("getBlockedUsers");
                setShowBlockedUsersModal(true);
                setShowProfileMenu(false);
              }}
            className={`w-full py-2 rounded-xl mt-4 font-semibold text-sm ${
  isDark
    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700"
    : "bg-gray-100 hover:bg-gray-200 border border-gray-300"
}`}
            >
              🚫 Blocked Users
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-xl mt-3 font-semibold"
            >
              {profile.isGuest ? "End Guest Session" : "Logout"}
            </button>

            
          </div>
        </div>
      )}
  {/* CHAT HISTORY */}
{showHistory && (
  <div className="fixed inset-0 z-50 flex justify-end">

    {/* BACKDROP */}
    <div
      className="absolute inset-0 bg-black/60"
      onClick={() => setShowHistory(false)}
    />

    {/* HISTORY PANEL */}
    <div
      className={`relative w-full max-w-[300px] h-full flex flex-col border-l transition-colors ${
        isDark
          ? "bg-gray-950 border-gray-800 text-white"
          : "bg-white border-gray-200 text-black shadow-xl"
      }`}
    >

      {/* HEADER */}
      <div
        className={`flex items-center justify-between px-4 py-4 border-b ${
          isDark
            ? "border-gray-800"
            : "border-gray-200"
        }`}
      >

        <div className="flex items-center gap-2">
          <span className="text-xl">
            🕘
          </span>

          <div>
            <h2 className="font-semibold text-sm">
              Chat History
            </h2>

            <p
              className={`text-[10px] ${
                isDark
                  ? "text-gray-500"
                  : "text-gray-400"
              }`}
            >
              Recent stranger chats
            </p>
          </div>
        </div>

        {/* CLOSE */}
        <button
          onClick={() => setShowHistory(false)}
          aria-label="Close history"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
            isDark
              ? "hover:bg-gray-800 text-gray-300"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          ✕
        </button>

      </div>


      {/* HISTORY LIST */}
      <div className="flex-1 overflow-y-auto p-2">

        {chatHistory.length === 0 ? (

          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">

            <div className="text-4xl mb-3">
              🕘
            </div>

            <p
              className={`text-sm ${
                isDark
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              No chat history yet.
            </p>

            <p
              className={`text-xs mt-1 ${
                isDark
                  ? "text-gray-600"
                  : "text-gray-400"
              }`}
            >
              Your recent stranger chats will appear here.
            </p>

          </div>

        ) : (

          /* HISTORY ITEMS */
          <div className="space-y-1">

            {chatHistory.map((item) => (

              <button
                key={`${item.userId}-${item.timestamp}`}
                onClick={() => {
               friends.loadFriendsList();   
               setHistoryProfile(item);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                  isDark
                    ? "hover:bg-gray-900"
                    : "hover:bg-gray-100"
                }`}
              >

                {/* AVATAR */}
                <div className="relative shrink-0">

                  <img
                    src={
                      item.avatarUrl ||
                      "/default-avatar.png"
                    }
                    alt={
                      item.name ||
                      "Stranger"
                    }
                    referrerPolicy="no-referrer"
                    className={`w-10 h-10 rounded-full border ${
                      isDark
                        ? "border-gray-700"
                        : "border-gray-200"
                    }`}
                  />

                  {/* PREMIUM */}
                  {item.isPremium && (
                    <span className="absolute -top-1 -right-1 text-xs">
                      👑
                    </span>
                  )}

                </div>


                {/* USER INFO */}
                <div className="min-w-0 flex-1">

                  <p className="font-medium text-sm truncate">
                    {item.name || "Stranger"}
                  </p>

                  <p
                    className={`text-[10px] mt-0.5 ${
                      isDark
                        ? "text-gray-500"
                        : "text-gray-400"
                    }`}
                  >
                    {new Date(
                      item.timestamp
                    ).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>

                </div>


                {/* ARROW */}
                <span
                  className={`text-lg ${
                    isDark
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  ›
                </span>

              </button>

            ))}

          </div>

        )}

      </div>


      {/* FOOTER */}
      {chatHistory.length > 0 && (
        <div
          className={`px-4 py-3 border-t ${
            isDark
              ? "border-gray-800"
              : "border-gray-200"
          }`}
        >

          <p
            className={`text-[10px] text-center ${
              isDark
                ? "text-gray-600"
                : "text-gray-400"
            }`}
          >
            Last {chatHistory.length} chats
          </p>

        </div>
      )}

    </div>
  </div>
)}
{/* HISTORY PROFILE CARD */}
{historyProfile && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">

    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/60"
      onClick={() => setHistoryProfile(null)}
    />

    {/* Profile Card */}
    <div
      onClick={(e) => e.stopPropagation()}
      className={`relative w-full max-w-xs rounded-2xl border p-5 shadow-2xl ${
        isDark
          ? "bg-gray-950 border-gray-800 text-white"
          : "bg-white border-gray-200 text-black"
      }`}
    >

      {/* Close */}
      <button
        onClick={() => setHistoryProfile(null)}
        aria-label="Close profile"
        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center ${
          isDark
            ? "hover:bg-gray-800 text-gray-400"
            : "hover:bg-gray-100 text-gray-500"
        }`}
      >
        ✕
      </button>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center pt-2">
        <div className="relative">
          <img
            src={historyProfile.avatarUrl || "/default-avatar.png"}
            alt={historyProfile.name || "Stranger"}
            referrerPolicy="no-referrer"
            className={`w-20 h-20 rounded-full border-2 ${
              isDark
                ? "border-gray-700"
                : "border-gray-200"
            }`}
          />

          {historyProfile.isPremium && (
            <span className="absolute -top-1 -right-1 text-lg">
              👑
            </span>
          )}
        </div>

        <h3 className="mt-3 text-lg font-semibold">
          {historyProfile.name || "Stranger"}
        </h3>

        <p
          className={`text-xs mt-1 ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Previous chat
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-5 space-y-2">

       {/* ADD FRIEND / ALREADY FRIENDS */}
      {friends.friends.some(
  (friend) => friend.userId === historyProfile.userId
) ? (
  <button
    onClick={() => {
      friends.removeFriend(historyProfile.userId);
      setHistoryProfile(null);
    }}
    className={`w-full py-2.5 rounded-xl font-semibold transition ${
      isDark
        ? "bg-gray-800 hover:bg-gray-700 text-white"
        : "bg-gray-100 hover:bg-gray-200 text-black"
    }`}
  >
    💔 Remove Friend
  </button>
) : (
  <button
    onClick={() => {
      friends.sendFriendRequestToUser(
        historyProfile.userId
      );
      setHistoryProfile(null);
    }}
    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
  >
    ➕ Add Friend
  </button>
)}
  
        {/* BLOCK */}
        <button
          onClick={() => {
            friends.blockFriend(
              historyProfile.userId
            );
            setHistoryProfile(null);
          }}
          className={`w-full py-2.5 rounded-xl font-semibold transition ${
            isDark
              ? "bg-gray-800 hover:bg-gray-700 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-black"
          }`}
        >
          🚫 Block
        </button>
       {/* REPORT */}
<button
  onClick={() => {
    setReportUserId(historyProfile.userId);
    setHistoryProfile(null);
    setReportReason("");
    setShowReport(true);
  }}
  className={`w-full py-2.5 rounded-xl font-semibold transition ${
    isDark
      ? "bg-gray-800 hover:bg-gray-700 text-yellow-400"
      : "bg-gray-100 hover:bg-gray-200 text-yellow-600"
  }`}
>
  ⚠️ Report
</button>
      </div>
    </div>
  </div>
)}
      {showReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div
  className={`rounded-2xl p-6 w-full max-w-xs ${
    isDark
      ? "bg-gray-900 text-white"
      : "bg-white text-black shadow-xl"
  }`}
>  
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
               className={`flex-1 rounded-full py-2 ${
  isDark
    ? "bg-gray-700 hover:bg-gray-600"
    : "bg-gray-200 hover:bg-gray-300"
}`}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (!reportReason) return;

                  socket.emit("reportUser", {
                    reason: reportReason,
                   ...(reportUserId ? { reportedUserId: reportUserId } : {}), 
                  });
                 if (reportUserId) {
  setChatHistory((prev) => {
    const updated = prev.filter(
      (item) => item.userId !== reportUserId
    );

    localStorage.setItem(
      "chatstranger_history",
      JSON.stringify(updated)
    );

    return updated;
  });
}

setShowReport(false);
setReportReason("");
setReportUserId(null);
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 sm:p-8 w-full max-w-xs flex flex-col items-center animate-pulse">
      <div className="text-4xl mb-4">✨</div>

      <h2 className="text-2xl font-bold text-white mb-4">
        Match Found
      </h2>

      <img


        referrerPolicy="no-referrer"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-xs text-center border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-xl"}`}>
            <img

              referrerPolicy="no-referrer"
              src={friends.incomingRequest.fromAvatarUrl}
              alt={friends.incomingRequest.fromDisplayName}
              className="w-16 h-16 rounded-full mx-auto mb-3"
            />

            <h2 className="font-bold text-lg">
              {friends.incomingRequest.fromDisplayName}
            </h2>

            <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              wants to add you as a friend
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => friends.respondToRequest(false)}
                className={`flex-1 rounded-full py-2 ${isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-black"}`}
              >
                Decline
              </button>

              <button
                onClick={() => friends.respondToRequest(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full py-2"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FRIEND REQUEST TOAST */}
      {friends.requestNotice && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xs text-center border px-4 py-2 rounded-full text-sm z-50 shadow-lg ${
          isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-black"
        }`}>
          {friends.requestNotice}
        </div>
      )}

      {/* PREMIUM FEATURE NOTICE TOAST */}
      {premiumNotice && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xs text-center border px-4 py-2 rounded-full text-sm z-50 shadow-lg ${
          isDark ? "bg-gray-800 border-yellow-700 text-yellow-200" : "bg-white border-yellow-400 text-yellow-700"
        }`}>
          👑 {premiumNotice}
        </div>
      )}

     {/* UNLOCK PREMIUM MODAL */}
{showPremiumModal && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
    <div
      className={`rounded-2xl p-6 w-full max-w-xs text-center border ${
        isDark
          ? "bg-gray-900 border-yellow-700/40 text-white"
          : "bg-white border-yellow-300 text-black shadow-xl"
      }`}
    >
      <div className="text-4xl mb-2">👑</div>

      <h2 className="font-bold text-xl">
        Free Premium Acccess
      </h2>
<p className="text-sm mt-2 text-gray-500">
  Premium features are currently free during early access.
</p>
      <ul
        className={`text-sm mt-4 space-y-2 text-left ${
          isDark ? "text-gray-300" : "text-gray-600"
        }`}
      >
        <li>✓ Gender preferences</li>
        <li>✓ Priority matching</li>
        <li>✓ Unlimited media uploads</li>
        <li>✓ Future premium features</li>
      </ul>

      <button
        onClick={() => {
          handleDevTogglePremium();
          setShowPremiumModal(false);
        }}
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-full py-3 mt-6"
      >
        Free Upgrade
      </button>

      <button
        onClick={() => setShowPremiumModal(false)}
        className={`w-full text-sm mt-3 ${
          isDark
            ? "text-gray-400 hover:text-white"
            : "text-gray-600 hover:text-black"
        }`}
      >
        Maybe later
      </button>
    </div>
  </div>
)} 

      {/* BLOCKED USERS MODAL */}
      {showBlockedUsersModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className={`rounded-2xl p-6 w-full max-w-xs max-h-[70vh] flex flex-col text-center border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="text-4xl mb-2">🚫</div>

            <h2 className="font-bold text-xl">Blocked Users</h2>

            {blockedUsers.length === 0 ? (
              <p className={`text-sm mt-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                You haven't blocked anyone yet.
              </p>
            ) : (
              <div className="mt-4 flex-1 overflow-y-auto space-y-2 text-left">
                {blockedUsers.map((u) => (
                  <div
                    key={u.userId}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
                  >
                    <div className="relative shrink-0">
                      <img

                        referrerPolicy="no-referrer"
                        src={u.avatarUrl || "/default-avatar.png"}
                        alt={u.displayName}
                        className="w-8 h-8 rounded-full"
                      />
                      {u.isPremium && (
                        <span className="absolute -top-1 -right-1 text-[10px]" title="Premium">
                          👑
                        </span>
                      )}
                    </div>
                    <span className="flex-1 text-sm truncate">{u.displayName}</span>
                    <button
                      onClick={() => socket.emit("unblockUser", { blockedUserId: u.userId })}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 whitespace-nowrap"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowBlockedUsersModal(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-full py-3 mt-6 shrink-0"
            >
              Close
            </button>
          </div>
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
        onSendFile={friends.sendFriendFile}
        onCloseChat={friends.closeFriendChat}
        unreadCounts={friends.unreadCounts}
        isPremium={isPremium}
        onPremiumRequired={() => setShowPremiumModal(true)}
        onRemoveFriend={friends.removeFriend}
        onBlockFriend={friends.blockFriend}
        isDark={isDark}
      />

      <footer className="border-t border-gray-800 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4">
        <div className="flex items-center gap-1.5 sm:gap-3">
        {/* NEXT BUTTON — h-11 keeps it at/above the ~44px touch-target minimum */}
<button
  onClick={handleNext}
  className={`h-11 shrink-0 px-3 rounded-full text-sm font-semibold whitespace-nowrap ${
    isDark
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-red-500 hover:bg-red-600 text-white shadow-sm"
  }`}
>
  {confirmNext ? "Confirm" : "Next"}
</button>  

          {/* MESSAGE INPUT with attach button inside, at the right */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
          />

          <div className="relative flex-1">
            <input
              disabled={status !== "Connected"}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);

                socket.emit("typing");

                clearTimeout((window as any).typingTimer);

                (window as any).typingTimer = setTimeout(() => {
                  socket.emit("stopTyping");
                }, 4000);
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
              className={`w-full rounded-full pl-12 pr-11 py-3 text-base outline-none border transition ${
                isDark
                  ? "bg-gray-900 text-white placeholder-gray-500 border-gray-800"
                  : "bg-gray-100 text-black placeholder-gray-400 border-gray-300"
              }`}
            />
            {/* EMOJI BUTTON + PICKER */}
<div
  ref={emojiPickerRef}
  className="conyents"
>
  {/* EMOJI BUTTON */}
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.currentTarget.blur();
      setShowEmojiPicker((prev) => !prev);
    }}
    disabled={status !== "Connected"}
    aria-label="Open emoji picker"
    title="Emoji"
    className={`absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-xl transition ${
      status === "Connected"
        ? isDark
          ? "hover:bg-gray-700 text-gray-300"
          : "hover:bg-gray-200 text-gray-600"
        : "text-gray-600 cursor-not-allowed"
    }`}
  >
    😊
  </button>

  {/* EMOJI PICKER */}
  {showEmojiPicker && status === "Connected" && (
    <div className="absolute bottom-14 left-0 z-50">
      <EmojiPicker
        onEmojiClick={handleEmojiClick}
        theme={isDark ? Theme.DARK : Theme.LIGHT}
        width={320}
        height={400}
        searchDisabled={false}
        skinTonesDisabled={false}
        autoFocusSearch={false}
      />
    </div>
  )}
</div>
            <button
              onClick={() => {
                if (!isPremium) {
                  setShowPremiumModal(true);
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={status !== "Connected" || isUploading}
              title={!isPremium ? "Sending photos/videos is a premium feature" : undefined}
              className={`absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-sm ${
                status === "Connected" && !isUploading
                  ? "hover:bg-gray-700 text-gray-300"
                  : "text-gray-600 cursor-not-allowed"
              }`}
            >
              {isUploading ? "..." : "📎"}
            </button>
          </div>
{/* SEND BUTTON */}
<button
  onClick={sendMessage}
  disabled={status !== "Connected"}
  aria-label="Send message"
  title="Send message"
  className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all ${
    status === "Connected"
      ? "bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105 shadow-lg shadow-purple-500/20"
      : isDark
        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
        : "bg-gray-300 text-gray-400 cursor-not-allowed"
  }`}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 text-white rotate-45"
  >
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
</button>
          
        </div>
      </footer>
    </main>
  );
}
