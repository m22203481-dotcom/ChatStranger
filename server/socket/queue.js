const waitingUsers = [];

export function addToQueue(socketId) {
    if (!waitingUsers.includes(socketId)) {
        waitingUsers.push(socketId);
    }

    console.log("QUEUE:", waitingUsers);
}

export function removeFromQueue(socketId) {
    const index = waitingUsers.indexOf(socketId);

    if (index !== -1) {
        waitingUsers.splice(index, 1);
    }

    console.log("QUEUE AFTER REMOVE:", waitingUsers);
}

export function getNextPair() {
    console.log("GET NEXT PAIR QUEUE:", waitingUsers);

    if (waitingUsers.length < 2) return null;

    const user1 = waitingUsers.shift();
    const user2 = waitingUsers.shift();

    return [user1, user2];
}