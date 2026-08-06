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
      "https://chatstranger.chat",
      "https://www.chatstranger.chat",
    ],
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("🚀 StrangerConnect Server is running!");
});

let waitingUser = null;

io.on("connection", (socket) => {

  console.log(`✅ User connected: ${socket.id}`);


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


  socket.on("message", (message) => {

    console.log("📩 Message received:", message);

    if (socket.partner) {
      socket.partner.emit("message", message);
    }

  });


  // NEXT BUTTON
  socket.on("nextStranger", () => {

    console.log("⏭ User skipped chat:", socket.id);


    // Notify the other person
    if (socket.partner) {

      socket.partner.emit(
        "partnerSkipped"
      );

      socket.partner.partner = null;

    }


    // Remove current connection
    socket.partner = null;


    // Put this user back into search
    if (waitingUser === null) {

      waitingUser = socket;

      socket.emit("waiting");

    }

  });



  socket.on("disconnect", () => {

    console.log(`❌ User disconnected: ${socket.id}`);


    if (waitingUser === socket) {
      waitingUser = null;
    }


    if (socket.partner) {

      socket.partner.emit(
        "partnerDisconnected"
      );

      socket.partner.partner = null;

    }

  });

});


server.listen(5001, () => {
  console.log(
    "🚀 Server running on http://localhost:5001"
  );
});