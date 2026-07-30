"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages, {
  Message,
} from "@/components/ChatMessages";
import { socket } from "@/services/socket";
import useSocket from "@/app/hooks/useSocket";
import { signOut } from "next-auth/react";
export default function ChatPage() {
const { data: session, status: authStatus } =
  useSession();
 
const router = useRouter();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Searching...");
  const [showProfileMenu, setShowProfileMenu] =
  useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [confirmNext, setConfirmNext] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [messages, setMessages] =
    useState<Message[]>([]);

const statusRef = useRef(status);

useEffect(() => {
  statusRef.current = status;
}, [status]);


  const bottomRef =
    useRef<HTMLDivElement>(null);

useEffect(() => {

  if (authStatus === "unauthenticated") {

    router.replace("/login");

  }

}, [authStatus, router]);

  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);


  useSocket({
    setStatus,
    setMessages,
    setOnlineUsers,
    setIsTyping,
  });


  const sendMessage = () => {

    if (!message.trim()) return;


    const newMessage = message;


    setMessages((prev) => [
      ...prev,
      {
        text: newMessage,
        sender: "me",
        timestamp: Date.now(),
      },
    ]);


    socket.emit(
      "sendMessage",
      newMessage
    );


    setMessage("");

  };
const handleNext = useCallback(() => {

  // If stranger disconnected, allow immediate next search
  if (status !== "Connected") {

    socket.emit(
      "nextStranger"
    );

    setStatus(
      "Searching..."
    );

    setMessages([]);

    setConfirmNext(false);

    return;
  }


  // Connected state: require confirmation

  
  if (!confirmNext) {

    setConfirmNext(true);

    setTimeout(() => {
      setConfirmNext(false);
    }, 3000);

    return;
  }


  socket.emit(
    "nextStranger"
  );

  setStatus(
    "Searching..."
  );

  setMessages([]);

  setConfirmNext(false);

}, [confirmNext, status]);


  // ESC KEY FOR NEXT


useEffect(() => {

  const handleEscape = (e: KeyboardEvent) => {

    if (e.key !== "Escape") return;

    handleNext();

  };


  window.addEventListener(
    "keydown",
    handleEscape
  );


  return () => {
    window.removeEventListener(
      "keydown",
      handleEscape
    );
  };


}, [handleNext]);
 
if (authStatus === "loading") {

  return (

    <main className="h-screen bg-black text-white flex items-center justify-center">

      Loading...

    </main>

  );

}
if (!session) {

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
  session={session}
  onProfileClick={() =>
    setShowProfileMenu(true)
  }
/> 

     <div className="flex-1 flex flex-col min-h-0"> 

        <ChatMessages
          messages={messages}
        />

        <div ref={bottomRef}></div>

        {isTyping && (
  <div className="px-4 pb-2 text-sm text-gray-400">
    Stranger is typing...
  </div>
)}

<div className="px-4 pb-2 text-sm font-medium">
  {status === "Connected" && (
    <span className="text-green-400">
      🟢 Connected
    </span>
  )}

  {status === "Searching..." && (
    <span className="text-yellow-400">
      🔍 Searching for stranger...
    </span>
  )}

  {status === "Stranger disconnected" && (
    <span className="text-red-400">
      🔴 Stranger disconnected
    </span>
  )}
</div>

</div>

{showProfileMenu && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

<div className="bg-gray-900 rounded-2xl p-6 w-80 border border-gray-800 relative flex flex-col min-h-[420px]">
  <button
  onClick={() =>
    setShowProfileMenu(false)
  }
  className="absolute top-3 right-4 text-gray-400 hover:text-white text-xl"
>
  ✕
</button>
      <div className="flex flex-col items-center mb-6">

        <img
  src={session?.user?.image || "/default-avatar.png"}
  alt="Profile"
  className="w-20 h-20 rounded-full border border-gray-700 mb-3"
/>

        <h2 className="font-bold text-lg">
          {session?.user?.name}
        </h2>

        <p className="text-sm text-gray-400 text-center break-all">
          {session?.user?.email}
        </p>

      </div>

      

      <button
        disabled
        className="w-full bg-gray-700 py-3 rounded-xl mb-3 text-gray-400"
      >
        Coming Soon
      </button>

      <button
        disabled
        className="w-full bg-gray-700 py-3 rounded-xl text-gray-400"
      >
        Coming Soon
      </button>
<button
  onClick={() =>
    signOut({
      callbackUrl: "/login",
    })
  }
  className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-xl mt-4 font-semibold"
>
  Logout
</button>

    </div>

  </div>
)}
      {showReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-gray-900 rounded-2xl p-6 w-80">

            <h2 className="text-xl font-bold mb-4">
              Report User
            </h2>


            <div className="space-y-3">

              {[
                "Spam",
                "Harassment",
                "Inappropriate Content",
                "Other",
              ].map((reason) => (

                <label
                  key={reason}
                  className="flex gap-3 items-center"
                >

                  <input
                    type="radio"
                    name="report"
                    value={reason}
                    onChange={() =>
                      setReportReason(reason)
                    }
                  />

                  {reason}

                </label>

              ))}

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

                  socket.emit(
                    "reportUser",
                    {
                      reason: reportReason,
                    }
                  );

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

              setMessage(
                e.target.value
              );

              socket.emit("typing");


              clearTimeout(
                (window as any)
                  .typingTimer
              );


              (
                window as any
              ).typingTimer =
                setTimeout(() => {

                  socket.emit(
                    "stopTyping"
                  );

                }, 1000);

            }}

            onKeyDown={(e) => {

            if (
  e.key === "Enter" &&
  status === "Connected"
) {
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