import {
    addUser,
    removeUser,
    getOnlineCount
} from "./users.js";

import {
    addToQueue,
    removeFromQueue,
    getNextPair
} from "./queue.js";

import {
    createRoom,
    removeRoom,
    getRoom
} from "./rooms.js";

export default function registerSocketEvents(io) {

    console.log("Socket system initialized");

    const userRooms = new Map();

    io.on("connection", (socket) => {

        console.log("User connected:", socket.id);

        addUser(socket.id);

        io.emit(
            "onlineUsers",
            getOnlineCount()
        );

        // FIND STRANGER
        socket.on("findStranger", () => {

            console.log("FIND REQUEST:", socket.id);

            removeFromQueue(socket.id);

            addToQueue(socket.id);

            console.log("QUEUE ADD:", socket.id);

            const pair = getNextPair();

            console.log("PAIR RESULT:", pair);

            if (!pair) {
                socket.emit("waiting");
                return;
            }

            const [user1, user2] = pair;

            const room = createRoom(
                user1,
                user2
            );

            userRooms.set(user1, room);
            userRooms.set(user2, room);

            console.log("ROOM CREATED:", room);

            const socket1 =
                io.sockets.sockets.get(user1);

            const socket2 =
                io.sockets.sockets.get(user2);

            if (socket1) {
                socket1.join(room);
                socket1.emit("matched", { room });
            }

            if (socket2) {
                socket2.join(room);
                socket2.emit("matched", { room });
            }

            console.log(
                "Matched:",
                user1,
                user2,
                room
            );
        });

        // SEND MESSAGE
        socket.on("sendMessage", (message) => {
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

    const room =
        userRooms.get(socket.id);

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
            console.log(
                "MESSAGE RECEIVED:",
                socket.id,
                message
            );

            const room =
                userRooms.get(socket.id);

            console.log(
                "Message:",
                socket.id,
                room,
                message
            );

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

        // NEXT STRANGER
        socket.on("nextStranger", () => {

    console.log(
        "NEXT REQUEST:",
        socket.id
    );


    const oldRoom =
        userRooms.get(socket.id);


    if (oldRoom) {

        socket
            .to(oldRoom)
            .emit(
                "strangerDisconnected"
            );


        const roomData =
            getRoom(oldRoom);


        if (roomData) {

            roomData.users.forEach(
                (user) => {

                    userRooms.delete(user);

                }
            );

        }


        removeRoom(oldRoom);

    }


    removeFromQueue(socket.id);


    addToQueue(socket.id);


    socket.emit(
        "waiting"
    );


    const pair =
        getNextPair();


    console.log(
        "NEXT PAIR:",
        pair
    );


    if (!pair) {
        return;
    }


    const [user1, user2] = pair;


    const newRoom =
        createRoom(
            user1,
            user2
        );


    userRooms.set(
        user1,
        newRoom
    );


    userRooms.set(
        user2,
        newRoom
    );


    const socket1 =
        io.sockets.sockets.get(user1);


    const socket2 =
        io.sockets.sockets.get(user2);



    if (socket1) {

        socket1.join(newRoom);

        socket1.emit(
            "matched",
            {
                room: newRoom
            }
        );

    }



    if (socket2) {

        socket2.join(newRoom);

        socket2.emit(
            "matched",
            {
                room: newRoom
            }
        );

    }



    console.log(
        "NEXT MATCHED:",
        user1,
        user2,
        newRoom
    );

});
        // DISCONNECT
        socket.on("disconnect", () => {

            const room =
                userRooms.get(socket.id);

            console.log(
                "LOOKUP ROOM:",
                socket.id,
                room
            );

            if (room) {

                socket
                    .to(room)
                    .emit(
                        "strangerDisconnected"
                    );

                removeRoom(room);
            }

            userRooms.delete(
                socket.id
            );

            removeFromQueue(
                socket.id
            );

            removeUser(
                socket.id
            );

            io.emit(
                "onlineUsers",
                getOnlineCount()
            );
        });

    });

}