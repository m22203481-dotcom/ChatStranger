import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { Server } from "socket.io";
import initializeSocket from "./config/socket.js";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.js";

dotenv.config();

const app = express();

const server = http.createServer(app);

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());

app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
    res.json({
        success: true,
        name: "StrangerConnect API",
        version: "1.0.0",
        status: "Running"
    });
});

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

initializeSocket(io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {

    server.listen(PORT, () => {
        console.log("");
        console.log("==================================");
        console.log(" StrangerConnect Server Started");
        console.log("==================================");
        console.log(` Port : ${PORT}`);
        console.log(` Mode : ${process.env.NODE_ENV}`);
        console.log("==================================");
    });

});
