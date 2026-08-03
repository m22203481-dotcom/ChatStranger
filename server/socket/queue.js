const waitingUsers = [];

// socketId -> string[] of lowercase interest tags
const userInterests = new Map();

// socketId -> resolved account/user id (Google id or anonymous-token-backed
// user id), when known. Used to make sure we never pair two sockets that
// actually belong to the same person (e.g. two tabs, or a reconnect that
// briefly leaves an old socket lingering in the queue).
const socketOwners = new Map();

// socketId -> { isPremium, gender, genderPreference } — premium/gender data
// used for priority ordering and gender-filtered matching.
const socketMeta = new Map();

const blockedPairs = new Set();

const userBlockedIds = new Map();


   function persistentlyBlocked(user1, user2) {

    const owner1 = socketOwners.get(user1);
    const owner2 = socketOwners.get(user2);

    const blocked1 = userBlockedIds.get(user1) || [];
    const blocked2 = userBlockedIds.get(user2) || [];

    return (
        (owner2 && blocked1.includes(owner2)) ||
        (owner1 && blocked2.includes(owner1))
    );
}

export function addToQueue(socketId, interests = [], userId = null, options = {}) {

 const {
    isPremium = false,
    gender = null,
    genderPreference = [],
    blockedUserIds = [],
} = options;   

    const alreadyQueued = waitingUsers.includes(socketId);

    if (!alreadyQueued) {

        // Premium users get priority: they go to the FRONT of the queue
        // instead of the back, so both matching passes below (which scan
        // front-to-back) consider them before anyone waiting behind them.
        if (isPremium) {
            waitingUsers.unshift(socketId);
        } else {
            waitingUsers.push(socketId);
        }

    }

    const cleanInterests = interests
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);

    userInterests.set(socketId, cleanInterests);

    socketMeta.set(socketId, {
        isPremium: Boolean(isPremium),
        gender: gender || null,
        genderPreference: Array.isArray(genderPreference)
            ? genderPreference.map((g) => String(g).toLowerCase())
            : [],
    });
     userBlockedIds.set(
    socketId,
    Array.isArray(blockedUserIds)
        ? blockedUserIds.map(String)
        : []
);
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
    userBlockedIds.delete(socketId);
    userInterests.delete(socketId);
    socketOwners.delete(socketId);
    socketMeta.delete(socketId);

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


// True if neither side's gender preference (a premium-only filter) rules
// out the other. A user with no preference set imposes no restriction —
// only premium users can have a non-empty genderPreference in the first
// place (enforced by the caller), but this function only cares about
// what's actually stored here.
function genderCompatible(user1, user2) {

    const meta1 = socketMeta.get(user1) || {};
    const meta2 = socketMeta.get(user2) || {};

    const pref1 = meta1.genderPreference || [];
    const pref2 = meta2.genderPreference || [];

    if (pref1.length > 0) {

        if (!meta2.gender || !pref1.includes(meta2.gender)) {
            return false;
        }

    }

    if (pref2.length > 0) {

        if (!meta1.gender || !pref2.includes(meta1.gender)) {
            return false;
        }

    }

    return true;

}


export function blockPair(user1, user2) {

    blockedPairs.add(
        `${user1}:${user2}`
    );

    blockedPairs.add(
        `${user2}:${user1}`
    );

}


// Reverses blockPair — used when "undoing" a skip so the same two people
// can be matched with each other again.
export function unblockPair(user1, user2) {

    blockedPairs.delete(`${user1}:${user2}`);
    blockedPairs.delete(`${user2}:${user1}`);

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

            if (persistentlyBlocked(user1, user2)) continue;

            if (!genderCompatible(user1, user2)) continue;

            const shared = sharedInterests(user1, user2);

            if (shared.length > 0) {

                waitingUsers.splice(j, 1);
                waitingUsers.splice(i, 1);

                userInterests.delete(user1);
                userInterests.delete(user2);
                socketMeta.delete(user1);
                socketMeta.delete(user2);
                userBlockedIds.delete(user1);
                userBlockedIds.delete(user2);

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

            if (blockedPairs.has(`${user1}:${user2}`)) continue;

            if (persistentlyBlocked(user1, user2)) continue;

            if (!genderCompatible(user1, user2)) continue;

            waitingUsers.splice(j, 1);
            waitingUsers.splice(i, 1);

            userInterests.delete(user1);
            userInterests.delete(user2);
            socketMeta.delete(user1);
            socketMeta.delete(user2);
            userBlockedIds.delete(user1);
            userBlockedIds.delete(user2);

            return { pair: [user1, user2], sharedTags: [] };
        }
    }


    return null;
}
