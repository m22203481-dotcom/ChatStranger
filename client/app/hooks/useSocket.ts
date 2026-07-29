import { useEffect } from "react";
import { socket } from "@/services/socket";

type UseSocketProps = {
  setStatus: (status: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setOnlineUsers: React.Dispatch<React.SetStateAction<number>>;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function useSocket({
  setStatus,
  setMessages,
  setOnlineUsers,
  setIsTyping,
}: UseSocketProps) {

  useEffect(() => {

    socket.connect();


    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });


    socket.on("waiting", () => {
      console.log("Waiting...");
      setStatus("Searching...");
    });


    socket.on("matched", (data) => {
  console.log("🔥 MATCHED EVENT:", data);

  setMessages([]);
  setStatus("Connected");
});


    socket.on("onlineUsers", (count:number) => {
      setOnlineUsers(count);
    });


    // FIXED: server sends receiveMessage
    socket.on("receiveMessage", (data:any) => {

  console.log("Received message:", data);

  setMessages((prev)=>[
    ...prev,
    {
      text:data.message,
      sender:"stranger",
      timestamp:Date.now(),
    }
  ]);

});


    // FIXED: server sends strangerTyping
    socket.on(
      "strangerTyping",()=>{
        setIsTyping(true);

        setTimeout(()=>{
          setIsTyping(false);
        },1000);

      }
    );


    // FIXED: server sends strangerDisconnected
    socket.on(
      "strangerDisconnected",
      ()=>{

        setMessages([]);

        setStatus("Stranger disconnected");

      }
    );


    return () => {

      socket.off();

      socket.disconnect();

    };


  }, []);

}