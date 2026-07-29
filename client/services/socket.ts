import { io } from "socket.io-client";

export const socket = io(
  "https://stranger-connect-4s2z.onrender.com",
   {
  autoConnect: false,
});