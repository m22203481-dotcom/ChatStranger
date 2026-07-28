const rooms = new Map();

export function createRoom(user1, user2) {
    const roomId = `room-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

    rooms.set(roomId, {
        id: roomId,
        users: [user1, user2]
    });

    return roomId;
}

export function getRoom(roomId) {
    return rooms.get(roomId);
}

export function removeRoom(roomId) {
    rooms.delete(roomId);
}