const waitingUsers = [];

// socketId -> string[] of lowercase interest tags
const userInterests = new Map();

// socketId -> resolved account/user id (Google id or anonymous-token-backed
// user id), when known. Used to make sure we never pair two sockets that
// actually belong to the same person (e.g. two tabs, or a reconnect that
// briefly leaves an old socket lingering in the queue).
const socketOwners = new Map();

const blockedPairs = new Set();


export function addToQueue(socketId, interests = [], userId = null) {

    if (!waitingUsers.includes(socketId)) {
        waitingUsers.push(socketId);
    }

    const cleanInterests = interests
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);

    userInterests.set(socketId, cleanInterests);

    if (userId) {
        socketOwners.set(socketId, userId);
    } else {
        socketOwners.delete(socketId);
    }

    console.log("QUEUE:", waitingUsers);
    console.log("INTERESTS SET:", socketId, cleanInterests);
}


export function removeFromQueue(socketId) {

    const index =
        waitingUsers.indexOf(socketId);

    if (index !== -1) {
        waitingUsers.splice(index, 1);
    }

    userInterests.delete(socketId);
    socketOwners.delete(socketId);

    console.log(
        "QUEUE AFTER REMOVE:",
        waitingUsers
    );
}


// True if two queued sockets are actually the same underlying person
// (same resolved account/anonymous-token id), so we must never pair them.
function isSamePerson(user1, user2) {

    if (user1 === user2) return true;

    const owner1 = socketOwners.get(user1);
    const owner2 = socketOwners.get(user2);

    return Boolean(owner1) && Boolean(owner2) && owner1 === owner2;

}


export function blockPair(user1, user2) {

    blockedPairs.add(
        `${user1}:${user2}`
    );

    blockedPairs.add(
        `${user2}:${user1}`
    );

}


function sharedInterests(user1, user2) {

    const tags1 = userInterests.get(user1) || [];
    const tags2 = userInterests.get(user2) || [];

    return tags1.filter((tag) => tags2.includes(tag));

}


// Returns { pair: [user1, user2], sharedTags: string[] } or null
export function getNextPair() {

    console.log(
        "GET NEXT PAIR QUEUE:",
        waitingUsers
    );


    if (waitingUsers.length < 2) {
        return null;
    }


    // PASS 1: look for a pair that shares at least one interest tag
    for (let i = 0; i < waitingUsers.length; i++) {

        const user1 = waitingUsers[i];
        const tags1 = userInterests.get(user1) || [];

        if (tags1.length === 0) continue;

        for (let j = i + 1; j < waitingUsers.length; j++) {

            const user2 = waitingUsers[j];

            if (isSamePerson(user1, user2)) continue;

            if (blockedPairs.has(`${user1}:${user2}`)) continue;

            const shared = sharedInterests(user1, user2);

            if (shared.length > 0) {

                waitingUsers.splice(j, 1);
                waitingUsers.splice(i, 1);

                userInterests.delete(user1);
                userInterests.delete(user2);

                return { pair: [user1, user2], sharedTags: shared };
            }
        }
    }


    // PASS 2: no interest overlap found — fall back to first available pair
    for (let i = 0; i < waitingUsers.length; i++) {

        for (let j = i + 1; j < waitingUsers.length; j++) {

            const user1 = waitingUsers[i];
            const user2 = waitingUsers[j];

            if (isSamePerson(user1, user2)) continue;

            if (!blockedPairs.has(`${user1}:${user2}`)) {

                waitingUsers.splice(j, 1);
                waitingUsers.splice(i, 1);

                userInterests.delete(user1);
                userInterests.delete(user2);

                return { pair: [user1, user2], sharedTags: [] };
            }
        }
    }


    return null;
}
