import { USER_STATUS } from "./constants.js";

const users = new Map();

/*
User Object

{
    socketId,
    roomId,
    partnerId,
    status
}
*/

export function addUser(socketId) {
    users.set(socketId, {
        socketId,
        roomId: null,
        partnerId: null,
        status: USER_STATUS.IDLE
    });
}

export function getUser(socketId) {
    return users.get(socketId);
}

export function updateUser(socketId, data) {
    const user = users.get(socketId);

    if (!user) return;

    users.set(socketId, {
        ...user,
        ...data
    });
}

export function removeUser(socketId) {
    users.delete(socketId);
}

export function getOnlineCount() {
    return users.size;
}

export function getAllUsers() {
    return [...users.values()];
}