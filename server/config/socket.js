import {
    addUser,
    removeUser,
    getOnlineCount
} from "../socket/users.js";

import {
    addToQueue,
    removeFromQueue,
    getNextPair,
    blockPair
} from "../socket/queue.js";

import {
    createRoom,
    removeRoom,
    getRoom
} from "../socket/rooms.js";
export default function registerSocketEvents(io) {

    console.log("Socket system initialized");

    const userRooms = new Map();

    // Remembers each socket's last-submitted interest tags so we can
    // requeue them (e.g. after a skip) without the client resending
    const socketInterests = new Map();
    const socketProfiles = new Map();

    io.on("connection", (socket) => {

        console.log("User connected:", socket.id);
socket.on("setProfile", (profile) => {

    let avatarUrl = profile.avatarUrl;

    if (avatarUrl?.includes("googleusercontent.com")) {
        avatarUrl =
            `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile.name)}`;
    }

    socketProfiles.set(socket.id, {
        ...profile,
        avatarUrl,
    });

    console.log(
        "PROFILE SAVED:",
        socket.id,
        profile.name
    );
});
        addUser(socket.id);

        io.emit(
            "onlineUsers",
            getOnlineCount()
        );

        function tryMatch(userA, userB) {

            const room = createRoom(userA, userB);

            userRooms.set(userA, room);
            userRooms.set(userB, room);

            console.log("ROOM CREATED:", room);

            const socketA = io.sockets.sockets.get(userA);
            const socketB = io.sockets.sockets.get(userB);

            return { room, socketA, socketB };

        }

        // FIND STRANGER
        socket.on("findStranger", (payload) => {

            console.log("FIND REQUEST:", socket.id, payload);

            const interests =
                payload?.interests ??
                socketInterests.get(socket.id) ??
                [];

            socketInterests.set(socket.id, interests);

            removeFromQueue(socket.id);

            addToQueue(socket.id, interests);

            console.log("QUEUE ADD:", socket.id);

            const result = getNextPair();

            console.log("PAIR RESULT:", result);

            if (!result) {
                socket.emit("waiting");
                return;
            }

            const { pair, sharedTags } = result;
            const [user1, user2] = pair;

            const { room, socketA, socketB } = tryMatch(user1, user2);

            if (socketA) {
                socketA.join(room);
             socketA.emit("matched", {
    room,
    sharedTags,
    stranger: socketProfiles.get(user2)
});   
            }

            if (socketB) {
                socketB.join(room);
             socketB.emit("matched", {
    room,
    sharedTags,
    stranger: socketProfiles.get(user1)
});  
            }

            console.log(
                "Matched:",
                user1,
                user2,
                room,
                "shared:",
                sharedTags
            );
        });

        // TYPING
        socket.on("typing", () => {

            const room = userRooms.get(socket.id);

            if (!room) return;

            socket.to(room).emit("strangerTyping");

        });

        socket.on("stopTyping", () => {

            const room = userRooms.get(socket.id);

            if (!room) return;

            socket.to(room).emit("stopTyping");

        });

        // SEND MESSAGE
        socket.on("sendMessage", (message) => {

            console.log(
                "MESSAGE RECEIVED:",
                socket.id,
                message
            );

            const room = userRooms.get(socket.id);

            if (!room) {
                return;
            }

            socket
                .to(room)
                .emit(
                    "receiveMessage",
                    { message }
                );

        });

        // REPORT USER
        socket.on("reportUser", ({ reason }) => {

            const room = userRooms.get(socket.id);

            if (!room) {
                return;
            }

            const roomData = getRoom(room);

            let reportedUser = null;

            if (roomData) {

                reportedUser = roomData.users.find(
                    (user) => user !== socket.id
                );

                console.log(
                    "REPORT:",
                    { reporter: socket.id, reportedUser, reason }
                );

                if (reportedUser) {

                    const reportedSocket =
                        io.sockets.sockets.get(reportedUser);

                    if (reportedSocket) {
                        reportedSocket.emit("strangerDisconnected");
                    }

                }

            }

            socket.emit("reportSubmitted");
            socket.emit("strangerDisconnected");

            if (roomData) {

                roomData.users.forEach((user) => {
                    userRooms.delete(user);
                });

            }

            removeRoom(room);

        });

        // NEXT STRANGER
        socket.on("nextStranger", () => {

            console.log("NEXT REQUEST:", socket.id);

            const oldRoom = userRooms.get(socket.id);

            if (oldRoom) {

                const roomData = getRoom(oldRoom);

                if (roomData) {

                    const otherUser = roomData.users.find(
                        (user) => user !== socket.id
                    );

                    console.log("ROOM USERS:", roomData.users);
                    console.log("CURRENT USER:", socket.id);
                    console.log("OTHER USER:", otherUser);

                    if (otherUser) {

                        blockPair(socket.id, otherUser);

                        const otherSocket =
                            io.sockets.sockets.get(otherUser);

                        console.log("OTHER SOCKET:", !!otherSocket);

                        if (otherSocket) {

                            console.log(
                                "EMITTING strangerSkipped TO:",
                                otherUser
                            );

                         otherSocket.emit(
    "strangerSkipped",
    socketProfiles.get(socket.id)
);   

                        }
                    }

                    roomData.users.forEach((user) => {
                        userRooms.delete(user);
                    });

                }

                removeRoom(oldRoom);

            }

            // Requeue the person who clicked Next, reusing their interests
            removeFromQueue(socket.id);

            const interests = socketInterests.get(socket.id) ?? [];

            addToQueue(socket.id, interests);

            socket.emit("waiting");

            const result = getNextPair();

            console.log("NEXT PAIR:", result);

            if (!result) {
                return;
            }

            const { pair, sharedTags } = result;
            const [user1, user2] = pair;

            const { room, socketA, socketB } = tryMatch(user1, user2);

            if (socketA) {
                socketA.join(room);
                socketA.emit("matched", { room, sharedTags });
            }

            if (socketB) {
                socketB.join(room);
                socketB.emit("matched", { room, sharedTags });
            }

            console.log(
                "NEXT MATCHED:",
                user1,
                user2,
                room,
                "shared:",
                sharedTags
            );

        });

        // DISCONNECT
        socket.on("disconnect", () => {

            const room = userRooms.get(socket.id);

            console.log("LOOKUP ROOM:", socket.id, room);

            if (room) {

             socket
 .to(room)
 .emit(
    "strangerDisconnected",
    socketProfiles.get(socket.id)
 );   

                removeRoom(room);
            }

            userRooms.delete(socket.id);
            removeFromQueue(socket.id);
            socketInterests.delete(socket.id);
            removeUser(socket.id);

            io.emit(
                "onlineUsers",
                getOnlineCount()
            );
        });

    });

}
