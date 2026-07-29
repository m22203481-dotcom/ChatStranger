import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? "https://stranger-connect-4s2z.onrender.com"
    : "http://localhost:5001";

export const socket = io(
  SOCKET_URL,
  {
    autoConnect: false,
  }
);