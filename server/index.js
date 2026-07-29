const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://connectstranger.vercel.app"
    ],
    methods: ["GET", "POST"],
  },
});

// Simple route to test the server
app.get("/", (req, res) => {
  res.send("🚀 StrangerConnect Server is running!");
});

// Stores one waiting user
let waitingUser = null;

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Match users
  if (waitingUser) {
    console.log("🎉 Match found!");

    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("matched");
    waitingUser.emit("matched");

    waitingUser = null;
  } else {
    console.log("⏳ No waiting user. Adding to queue.");

    waitingUser = socket;
    socket.emit("waiting");
  }

  // Receive message from one user and send it to partner
  socket.on("message", (message) => {
    console.log("📩 Message received:", message);

    if (socket.partner) {
      console.log("📤 Forwarding to partner");

      socket.partner.emit("message", message);
    } else {
      console.log("❌ No partner connected");
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);

    if (waitingUser === socket) {
      waitingUser = null;
    }

    if (socket.partner) {
      socket.partner.emit("partnerDisconnected");
      socket.partner.partner = null;
    }
  });
});

server.listen(5001, () => {
  console.log("🚀 Server running on http://localhost:5001");
});