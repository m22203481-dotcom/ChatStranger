import User from "../models/User.js";
import Friendship from "../models/Friendship.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Block from "../models/Block.js";

import {
    addUser,
    removeUser,
    getOnlineCount
} from "../socket/users.js";

import {
    addToQueue,
    removeFromQueue,
    getNextPair,
    unblockPair
} from "../socket/queue.js";

import {
    createRoom,
    removeRoom,
    getRoom
} from "../socket/rooms.js";

// Returns the persistent user ids that should never be matched with
// `userId` — people they've blocked, and people who've blocked them.
async function getBlockedUserIds(userId) {

    if (!userId) return [];

    try {

        const blocks = await Block.find({
            $or: [{ blocker: userId }, { blocked: userId }],
        });

        return blocks.map((b) =>
            b.blocker.toString() === userId
                ? b.blocked.toString()
                : b.blocker.toString()
        );

    } catch (error) {

        console.error("GET BLOCKED USER IDS ERROR:", error);
        return [];

    }

}

// Resolves whoever is on the other end of a socket connection to a real
// Mongo User document — works for both Google and anonymous/guest sessions
async function resolveUser(handshakeAuth) {

    if (!handshakeAuth) return null;

    if (handshakeAuth.provider === "google") {

        const { email, name } = handshakeAuth;

        if (!email) return null;

        let user = await User.findOne({ email });

        if (!user) {

            user = await User.create({
                authProvider: "google",
                email,
                displayName: name || "Google User",
                avatarUrl: "/default-avatar.png",
            });

        }

        return user;

    }

    if (handshakeAuth.provider === "anonymous") {

        const { token } = handshakeAuth;

        if (!token) return null;

        return User.findOne({
            authProvider: "anonymous",
            anonymousToken: token,
        });

    }

    return null;

}

function friendRoomName(userIdA, userIdB) {

    const sorted = [userIdA.toString(), userIdB.toString()].sort();

    return `friend-${sorted[0]}-${sorted[1]}`;

}

// userId -> number of currently-open sockets for that account (handles
// someone having the app open in more than one tab)
const onlineUserCounts = new Map();

async function broadcastFriendPresence(io, userId, isOnline) {

    try {

        const friendships = await Friendship.find({
            status: "accepted",
            $or: [{ requester: userId }, { recipient: userId }],
        });

        friendships.forEach((f) => {

            const otherId =
                f.requester.toString() === userId
                    ? f.recipient.toString()
                    : f.requester.toString();

            io.to(`user-${otherId}`).emit("friendPresence", {
                userId,
                isOnline,
            });

        });

    } catch (error) {

        console.error("BROADCAST PRESENCE ERROR:", error);

    }

}

export default function registerSocketEvents(io) {

    console.log("Socket system initialized");

    const userRooms = new Map();

    // Remembers each socket's last-submitted interest tags so we can
    // requeue them (e.g. after a skip) without the client resending
    const socketInterests = new Map();
    const socketProfiles = new Map();

    // Returns the stored {name, avatarUrl} profile for a socket, plus its
    // CURRENT isPremium status read live off the socket itself — so if
    // someone upgrades mid-chat (or via the dev toggle), the badge the
    // other person sees stays accurate rather than reflecting a stale
    // snapshot taken back when setProfile first ran.
    function getStrangerPayload(socketId) {

        const profile = socketProfiles.get(socketId);
        if (!profile) return profile;

        const liveSocket = io.sockets.sockets.get(socketId);

        return { ...profile, isPremium: Boolean(liveSocket?.isPremium) };

    }

    // Remembers each premium socket's chosen gender filter, same reuse
    // pattern as socketInterests (so "Next" reuses it without resending)
    const socketGenderPreference = new Map();

    // Premium-only "Undo Next": socketId -> { partnerSocketId, sharedTags,
    // expiresAt }, set right when someone skips, cleared on use/expiry
    const lastSkipped = new Map();
    const UNDO_GRACE_MS = 30 * 1000;

    // Reconnect grace period: if someone's tab closes/loses connection
    // mid-chat, they have this long to come back and resume the SAME
    // chat before it's treated as a real disconnect
    const RECONNECT_GRACE_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pendingReconnects = new Map(); // userId -> { room, partnerSocketId, oldSocketId, timer }
    const roomSharedTags = new Map(); // room -> sharedTags[]

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

        // Identify who this socket belongs to (Google or guest) so
        // friend requests / DMs / history can be tied to a real account.
        //
        // This used to be a bare fire-and-forget IIFE, which let
        // findStranger race ahead of socket.userId being set. If someone
        // had two sessions open (e.g. laptop + mobile) and hit "find"
        // on both before this resolved, addToQueue() saw userId=null
        // for both sockets, isSamePerson() had nothing to compare, and
        // the queue could pair a person with their own other device —
        // each side would then see the OTHER device's live profile
        // rendered as "the stranger".
        //
        // Fix: keep the identity resolution as a promise on the socket
        // itself, and have findStranger/nextStranger await it before
        // touching the queue. socket.userId is then guaranteed to be
        // fully settled (real id, or confirmed null for a guest) before
        // any matching decision is made.
        socket.identityPromise = (async () => {

            try {

                const dbUser = await resolveUser(socket.handshake.auth);

                if (dbUser) {

                    socket.userId = dbUser._id.toString();
                    socket.isPremium = Boolean(dbUser.isPremium);
                    socket.gender = dbUser.gender || null;

                    // A personal room so we can reach this user by ID even
                    // if they reconnect on a different socket later
                    socket.join(`user-${socket.userId}`);

                    socket.emit("identityResolved", {
                        userId: dbUser._id,
                        displayName: dbUser.displayName,
                        avatarUrl: dbUser.avatarUrl,
                        isPremium: dbUser.isPremium,
                        gender: dbUser.gender,
                    });

                    onlineUserCounts.set(
                        socket.userId,
                        (onlineUserCounts.get(socket.userId) || 0) + 1
                    );

                    broadcastFriendPresence(io, socket.userId, true);

                } else {

                    console.log("COULD NOT RESOLVE IDENTITY FOR:", socket.id);

                }

            } catch (error) {

                console.error("IDENTITY RESOLUTION ERROR:", error);

            }

        })();

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
        socket.on("findStranger", async (payload) => {

            // Make sure socket.userId is fully settled (not just "not
            // set yet") before we let this socket anywhere near the
            // queue — otherwise two sessions of the same account can
            // slip past isSamePerson() and get matched with each other.
            await socket.identityPromise;

            console.log("FIND REQUEST:", socket.id, payload);

            // Check for a pending reconnect first — if this user recently
            // disconnected mid-chat and is coming back within the grace
            // window, resume that SAME chat instead of a fresh search
            if (socket.userId && pendingReconnects.has(socket.userId)) {

                const pending = pendingReconnects.get(socket.userId);

                clearTimeout(pending.timer);
                pendingReconnects.delete(socket.userId);

                const roomData = getRoom(pending.room);

                let partnerSocket = null;

                if (roomData) {

                    // Swap our old (disconnected) socket id for the new one
                    const idx = roomData.users.indexOf(pending.oldSocketId);
                    if (idx !== -1) roomData.users[idx] = socket.id;

                    // Look up whoever is CURRENTLY the other occupant —
                    // not a cached id — since with a week-long grace
                    // window the partner may have reconnected too, on a
                    // different socket id than when we disconnected
                    const otherSocketId = roomData.users.find(
                        (id) => id !== socket.id
                    );

                    partnerSocket = otherSocketId
                        ? io.sockets.sockets.get(otherSocketId)
                        : null;

                }

                if (roomData && partnerSocket) {

                    socket.join(pending.room);
                    userRooms.set(socket.id, pending.room);

                    socket.emit("reconnected", {
                        room: pending.room,
                        sharedTags: roomSharedTags.get(pending.room) ?? [],
                        stranger: getStrangerPayload(partnerSocket.id),
                        strangerUserId: partnerSocket.userId ?? null,
                    });

                    partnerSocket.emit("strangerReconnected", {
                        stranger: getStrangerPayload(socket.id),
                    });

                    console.log(
                        "RESUMED CHAT for",
                        socket.userId,
                        "in room",
                        pending.room
                    );

                    return;

                }

                // Partner isn't currently reachable (moved on, or hasn't
                // reconnected yet themselves) — since we've already
                // cancelled our own grace timer, finalize cleanup of the
                // old room now rather than leaving it dangling
                if (roomData) {
                    removeRoom(pending.room);
                }

                roomSharedTags.delete(pending.room);

            }

            const interests =
                payload?.interests ??
                socketInterests.get(socket.id) ??
                [];

            socketInterests.set(socket.id, interests);

            // Gender filter is a premium-only feature — non-premium
            // sockets silently get an empty filter (no restriction)
            // regardless of what a tampered client might send.
            const genderPreference = socket.isPremium
                ? (payload?.genderPreference ?? socketGenderPreference.get(socket.id) ?? [])
                : [];

            socketGenderPreference.set(socket.id, genderPreference);

            const blockedUserIds = await getBlockedUserIds(socket.userId);
            console.log("QUEUE DEBUG:", socket.id, "userId=", socket.userId, "blockedUserIds=", blockedUserIds);

            removeFromQueue(socket.id);

            addToQueue(socket.id, interests, socket.userId ?? null, {
                isPremium: socket.isPremium,
                gender: socket.gender,
                genderPreference,
                blockedUserIds,
            });

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

            roomSharedTags.set(room, sharedTags);

            if (socketA) {
                socketA.join(room);
                socketA.emit("matched", {
                    room,
                    sharedTags,
                    stranger: getStrangerPayload(user2),
                    strangerUserId: socketB?.userId ?? null
                });
            }

            if (socketB) {
                socketB.join(room);
                socketB.emit("matched", {
                    room,
                    sharedTags,
                    stranger: getStrangerPayload(user1),
                    strangerUserId: socketA?.userId ?? null
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
        socket.on("sendMessage", (payload) => {

            console.log(
                "MESSAGE RECEIVED:",
                socket.id,
                payload
            );

            const room = userRooms.get(socket.id);

            if (!room) {
                return;
            }

            // Sending media is premium-only; free users can still
            // receive media a premium stranger sends them
            if (payload?.fileUrl && !socket.isPremium) {

                socket.emit("mediaBlocked");
                return;

            }

            socket
                .to(room)
                .emit(
                    "receiveMessage",
                    {
                        id: payload?.id,
                        message: payload?.message,
                        fileUrl: payload?.fileUrl,
                        fileType: payload?.fileType,
                        fileName: payload?.fileName,
                    }
                );

        });

        // Recipient's client confirms it actually received the message
        socket.on("messageDelivered", ({ id }) => {

            const room = userRooms.get(socket.id);

            if (!room || !id) return;

            socket.to(room).emit("messageStatusUpdate", {
                id,
                status: "delivered",
            });

        });

        // Recipient's client confirms the message was seen (tab visible)
        socket.on("messageRead", ({ id, ids }) => {

            const room = userRooms.get(socket.id);

            if (!room) return;

            const targetIds = ids ?? (id ? [id] : []);

            targetIds.forEach((msgId) => {

                socket.to(room).emit("messageStatusUpdate", {
                    id: msgId,
                    status: "read",
                });

            });

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
            roomSharedTags.delete(room);

        });

        // NEXT STRANGER
        socket.on("nextStranger", async () => {

            await socket.identityPromise;

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

                        // Previously called blockPair(socket.id, otherUser)
                        // here to permanently prevent A and B from being
                        // rematched after a skip. Removed per request —
                        // A and B can now be paired again on a future
                        // search, same as anyone else in the queue.
                        lastSkipped.set(socket.id, {
                            partnerSocketId: otherUser,
                            sharedTags: roomSharedTags.get(oldRoom) ?? [],
                            expiresAt: Date.now() + UNDO_GRACE_MS,
                        });

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
                                getStrangerPayload(socket.id)
                            );

                        }
                    }

                    roomData.users.forEach((user) => {
                        userRooms.delete(user);
                    });

                }

                removeRoom(oldRoom);
                roomSharedTags.delete(oldRoom);

            }

            // Requeue the person who clicked Next, reusing their interests
            removeFromQueue(socket.id);

            const interests = socketInterests.get(socket.id) ?? [];
            const genderPreference = socket.isPremium
                ? (socketGenderPreference.get(socket.id) ?? [])
                : [];
            const blockedUserIds = await getBlockedUserIds(socket.userId);
            console.log("QUEUE DEBUG:", socket.id, "userId=", socket.userId, "blockedUserIds=", blockedUserIds);

            addToQueue(socket.id, interests, socket.userId ?? null, {
                isPremium: socket.isPremium,
                gender: socket.gender,
                genderPreference,
                blockedUserIds,
            });

            socket.emit("waiting");

            const result = getNextPair();

            console.log("NEXT PAIR:", result);

            if (!result) {
                return;
            }

            const { pair, sharedTags } = result;
            const [user1, user2] = pair;

            const { room, socketA, socketB } = tryMatch(user1, user2);

            roomSharedTags.set(room, sharedTags);

            if (socketA) {
                socketA.join(room);
                socketA.emit("matched", {
                    room,
                    sharedTags,
                    stranger: getStrangerPayload(user2),
                    strangerUserId: socketB?.userId ?? null
                });
            }

            if (socketB) {
                socketB.join(room);
                socketB.emit("matched", {
                    room,
                    sharedTags,
                    stranger: getStrangerPayload(user1),
                    strangerUserId: socketA?.userId ?? null
                });
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

        // UNDO NEXT (premium only) — go back to the stranger you just
        // skipped, if they haven't already moved on to someone else
        socket.on("undoSkip", async () => {

            await socket.identityPromise;

            if (!socket.isPremium) {
                socket.emit("undoUnavailable", { reason: "premium_required" });
                return;
            }

            const pending = lastSkipped.get(socket.id);

            if (!pending || Date.now() > pending.expiresAt) {
                lastSkipped.delete(socket.id);
                socket.emit("undoUnavailable", { reason: "expired" });
                return;
            }

            const partnerSocket = io.sockets.sockets.get(pending.partnerSocketId);

            // Partner disconnected, or already talking to someone new —
            // either way there's nothing to restore
            if (!partnerSocket || userRooms.get(partnerSocket.id)) {
                lastSkipped.delete(socket.id);
                socket.emit("undoUnavailable", { reason: "partner_unavailable" });
                return;
            }

            removeFromQueue(socket.id);
            removeFromQueue(partnerSocket.id);
            unblockPair(socket.id, partnerSocket.id);

            lastSkipped.delete(socket.id);
            lastSkipped.delete(partnerSocket.id);

            const { room, socketA, socketB } = tryMatch(socket.id, partnerSocket.id);

            roomSharedTags.set(room, pending.sharedTags);

            socket.join(room);
            partnerSocket.join(room);

            socket.emit("matched", {
                room,
                sharedTags: pending.sharedTags,
                stranger: getStrangerPayload(partnerSocket.id),
                strangerUserId: partnerSocket.userId ?? null,
            });

            partnerSocket.emit("matched", {
                room,
                sharedTags: pending.sharedTags,
                stranger: getStrangerPayload(socket.id),
                strangerUserId: socket.userId ?? null,
            });

            console.log("UNDO SKIP: restored chat between", socket.id, "and", partnerSocket.id);

        });

        // DEV-ONLY: flip isPremium on/off for testing until real payments
        // are wired up. Deliberately a no-op outside development.
        socket.on("devTogglePremium", async () => {

            if (process.env.NODE_ENV === "production") return;
            if (!socket.userId) return;

            try {

                const user = await User.findById(socket.userId);

                if (!user) return;

                user.isPremium = !user.isPremium;
                await user.save();

                socket.isPremium = user.isPremium;

                socket.emit("identityResolved", {
                    userId: user._id,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                    isPremium: user.isPremium,
                    gender: user.gender,
                });

            } catch (error) {

                console.error("DEV TOGGLE PREMIUM ERROR:", error);

            }

        });

        // BLOCK — ends the current chat and permanently prevents this
        // pair from being matched again (unlike blockPair, which is just
        // a temporary skip-avoidance). Identifies the target the same
        // way sendFriendRequest does: whoever is in the room right now.
        socket.on("blockUser", async () => {

            await socket.identityPromise;

            if (!socket.userId) return;

            const room = userRooms.get(socket.id);
            if (!room) return;

            const roomData = getRoom(room);
            if (!roomData) return;

            const otherSocketId = roomData.users.find((id) => id !== socket.id);
            if (!otherSocketId) return;

            const otherSocket = io.sockets.sockets.get(otherSocketId);
            if (!otherSocket || !otherSocket.userId) return;

            try {

                await Block.updateOne(
                    { blocker: socket.userId, blocked: otherSocket.userId },
                    { $setOnInsert: { blocker: socket.userId, blocked: otherSocket.userId } },
                    { upsert: true }
                );

                // If this stranger happened to already be a friend, blocking
                // ends that too — same rule as blockFriend, just reached via
                // a different door (the stranger-chat dropdown vs the
                // friends list).
                const removedFriendship = await Friendship.findOneAndDelete({
                    status: "accepted",
                    $or: [
                        { requester: socket.userId, recipient: otherSocket.userId },
                        { requester: otherSocket.userId, recipient: socket.userId },
                    ],
                });

                if (removedFriendship) {

                    socket.emit("friendRemoved", { friendUserId: otherSocket.userId });

                    io.to(`user-${otherSocket.userId}`).emit("friendRemoved", {
                        friendUserId: socket.userId,
                    });

                }

            } catch (error) {

                console.error("BLOCK USER ERROR:", error);
                return;

            }

            // End the chat for both sides. The blocked person just sees
            // a normal disconnect — they're never told they were blocked.
            userRooms.delete(socket.id);
            userRooms.delete(otherSocket.id);
            removeRoom(room);

            otherSocket.emit("strangerDisconnected", getStrangerPayload(socket.id));

            socket.emit("userBlocked");

            // The blocker automatically starts searching again
            const interests = socketInterests.get(socket.id) ?? [];
            const genderPreference = socket.isPremium
                ? (socketGenderPreference.get(socket.id) ?? [])
                : [];
            const blockedUserIds = await getBlockedUserIds(socket.userId);
            console.log("QUEUE DEBUG:", socket.id, "userId=", socket.userId, "blockedUserIds=", blockedUserIds);

            addToQueue(socket.id, interests, socket.userId, {
                isPremium: socket.isPremium,
                gender: socket.gender,
                genderPreference,
                blockedUserIds,
            });

            console.log("BLOCKED:", socket.id, "blocked", otherSocket.id);

        });

        // Fetch the current user's blocked list (for the Blocked Users
        // menu), with each entry's live display name/avatar
        socket.on("getBlockedUsers", async () => {

            await socket.identityPromise;

            if (!socket.userId) {
                socket.emit("blockedUsersList", []);
                return;
            }

            try {

                const blocks = await Block.find({ blocker: socket.userId });
                const blockedIds = blocks.map((b) => b.blocked);

                const blockedUsers = await User.find({ _id: { $in: blockedIds } });

                socket.emit(
                    "blockedUsersList",
                    blockedUsers.map((u) => ({
                        userId: u._id,
                        displayName: u.displayName,
                        avatarUrl: u.avatarUrl,
                        isPremium: Boolean(u.isPremium),
                    }))
                );

            } catch (error) {

                console.error("GET BLOCKED USERS ERROR:", error);
                socket.emit("blockedUsersList", []);

            }

        });

        socket.on("unblockUser", async ({ blockedUserId }) => {

            await socket.identityPromise;

            if (!socket.userId || !blockedUserId) return;

            try {

                await Block.deleteOne({
                    blocker: socket.userId,
                    blocked: blockedUserId,
                });

                socket.emit("userUnblocked", { blockedUserId });

            } catch (error) {

                console.error("UNBLOCK USER ERROR:", error);

            }

        });

        socket.on("sendFriendRequest", async () => {

            if (!socket.userId) return;

            const room = userRooms.get(socket.id);

            if (!room) return;

            const roomData = getRoom(room);

            if (!roomData) return;

            const otherSocketId = roomData.users.find(
                (id) => id !== socket.id
            );

            if (!otherSocketId) return;

            const otherSocket = io.sockets.sockets.get(otherSocketId);

            if (!otherSocket || !otherSocket.userId) return;

            try {

                const existing = await Friendship.findOne({
                    $or: [
                        { requester: socket.userId, recipient: otherSocket.userId },
                        { requester: otherSocket.userId, recipient: socket.userId },
                    ],
                });

                let friendship;

                if (existing && existing.status !== "declined") {

                    // A pending or already-accepted request genuinely
                    // blocks sending another one
                    socket.emit("friendRequestStatus", {
                        status: existing.status,
                        alreadyExists: true,
                    });

                    return;

                } else if (existing) {

                    // Previously declined — don't let that stale record
                    // block a fresh request forever. Re-point it at
                    // whoever is sending now and reopen it as pending.
                    existing.requester = socket.userId;
                    existing.recipient = otherSocket.userId;
                    existing.status = "pending";
                    existing.respondedAt = undefined;

                    friendship = await existing.save();

                } else {

                    friendship = await Friendship.create({
                        requester: socket.userId,
                        recipient: otherSocket.userId,
                        status: "pending",
                    });

                }

                // Prefer the live session profile (matches what's on
                // screen right now); fall back to the saved account
                const requesterProfile = socketProfiles.get(socket.id);

                otherSocket.emit("friendRequestReceived", {
                    friendshipId: friendship._id,
                    fromUserId: socket.userId,
                    fromDisplayName: requesterProfile?.name,
                    fromAvatarUrl: requesterProfile?.avatarUrl,
                });

                socket.emit("friendRequestSent");

            } catch (error) {

                console.error("SEND FRIEND REQUEST ERROR:", error);

            }

        });

        socket.on("respondFriendRequest", async ({ friendshipId, accept }) => {

            if (!socket.userId) return;

            try {

                const friendship = await Friendship.findById(friendshipId);

                if (!friendship) return;
                if (friendship.recipient.toString() !== socket.userId) return;

                friendship.status = accept ? "accepted" : "declined";
                friendship.respondedAt = new Date();

                await friendship.save();

                const requesterUser = await User.findById(friendship.requester);
                const recipientUser = await User.findById(friendship.recipient);

                io.to(`user-${friendship.requester}`).emit("friendRequestStatus", {
                    friendshipId: friendship._id,
                    status: friendship.status,
                    otherUser: recipientUser && {
                        userId: recipientUser._id,
                        displayName: recipientUser.displayName,
                        avatarUrl: recipientUser.avatarUrl,
                    },
                });

                io.to(`user-${friendship.recipient}`).emit("friendRequestStatus", {
                    friendshipId: friendship._id,
                    status: friendship.status,
                    otherUser: requesterUser && {
                        userId: requesterUser._id,
                        displayName: requesterUser.displayName,
                        avatarUrl: requesterUser.avatarUrl,
                    },
                });

            } catch (error) {

                console.error("RESPOND FRIEND REQUEST ERROR:", error);

            }

        });

        socket.on("getFriendsList", async () => {

            if (!socket.userId) return;

            try {

                const friendships = await Friendship.find({
                    status: "accepted",
                    $or: [
                        { requester: socket.userId },
                        { recipient: socket.userId },
                    ],
                });

                const friendIds = friendships.map((f) =>
                    f.requester.toString() === socket.userId
                        ? f.recipient
                        : f.requester
                );

                const friendUsers = await User.find({ _id: { $in: friendIds } });

                // One query for every friend-DM conversation this user is
                // part of, so we can attach unread/lastMessageAt without
                // an N+1 query per friend
                const conversations = await Conversation.find({
                    isFriendChat: true,
                    participants: socket.userId,
                });

                const conversationByFriendId = new Map();

                conversations.forEach((c) => {

                    const otherId = c.participants
                        .map((p) => p.toString())
                        .find((id) => id !== socket.userId);

                    if (otherId) conversationByFriendId.set(otherId, c);

                });

                const enriched = await Promise.all(
                    friendUsers.map(async (f) => {

                        const friendId = f._id.toString();
                        const conversation = conversationByFriendId.get(friendId);

                        let unreadCount = 0;

                        if (conversation) {

                            const lastReadRaw = conversation.lastReadAt?.[socket.userId];
                            const lastReadAt = lastReadRaw ? new Date(lastReadRaw) : new Date(0);

                            unreadCount = await Message.countDocuments({
                                conversation: conversation._id,
                                sender: { $ne: socket.userId },
                                createdAt: { $gt: lastReadAt },
                            });

                        }

                        return {
                            userId: f._id,
                            displayName: f.displayName,
                            avatarUrl: f.avatarUrl,
                            isOnline: onlineUserCounts.has(friendId),
                            isPremium: Boolean(f.isPremium),
                            unreadCount,
                            lastMessageAt: conversation?.lastMessageAt
                                ? conversation.lastMessageAt.getTime()
                                : null,
                        };

                    })
                );

                // Most recent activity first; friends with no DM history
                // yet fall to the bottom
                enriched.sort(
                    (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
                );

                socket.emit("friendsList", enriched);

            } catch (error) {

                console.error("GET FRIENDS LIST ERROR:", error);

            }

        });

        socket.on("removeFriend", async ({ friendUserId }) => {

            if (!socket.userId || !friendUserId) return;

            try {

                await Friendship.deleteOne({
                    status: "accepted",
                    $or: [
                        { requester: socket.userId, recipient: friendUserId },
                        { requester: friendUserId, recipient: socket.userId },
                    ],
                });

                socket.emit("friendRemoved", { friendUserId });

                io.to(`user-${friendUserId}`).emit("friendRemoved", {
                    friendUserId: socket.userId,
                });

            } catch (error) {

                console.error("REMOVE FRIEND ERROR:", error);

            }

        });

        // BLOCK A FRIEND (from the friends list, not mid-chat) — ends the
        // friendship the same way removeFriend does, and additionally
        // creates a persistent Block record so they also show up in the
        // Blocked Users list and can never be randomly matched again.
        socket.on("blockFriend", async ({ friendUserId }) => {

            if (!socket.userId || !friendUserId) return;

            try {

                await Block.updateOne(
                    { blocker: socket.userId, blocked: friendUserId },
                    { $setOnInsert: { blocker: socket.userId, blocked: friendUserId } },
                    { upsert: true }
                );

                await Friendship.deleteOne({
                    status: "accepted",
                    $or: [
                        { requester: socket.userId, recipient: friendUserId },
                        { requester: friendUserId, recipient: socket.userId },
                    ],
                });

                socket.emit("friendRemoved", { friendUserId });

                io.to(`user-${friendUserId}`).emit("friendRemoved", {
                    friendUserId: socket.userId,
                });

            } catch (error) {

                console.error("BLOCK FRIEND ERROR:", error);

            }

        });

        // ============ FRIEND DM CHAT ============
        // (unlike random chats, these ARE persisted)

        socket.on("openFriendChat", async ({ friendUserId }) => {

            if (!socket.userId) return;

            try {

                let conversation = await Conversation.findOne({
                    isFriendChat: true,
                    participants: { $all: [socket.userId, friendUserId] },
                });

                if (!conversation) {

                    conversation = await Conversation.create({
                        participants: [socket.userId, friendUserId],
                        isFriendChat: true,
                    });

                }

                const roomName = friendRoomName(socket.userId, friendUserId);

                socket.join(roomName);

                // Opening the chat counts as reading it
                await Conversation.updateOne(
                    { _id: conversation._id },
                    {
                        $addToSet: { readBy: socket.userId },
                        $set: { [`lastReadAt.${socket.userId}`]: new Date() },
                    }
                );

                const pastMessages = await Message.find({
                    conversation: conversation._id,
                })
                    .sort({ createdAt: 1 })
                    .limit(200);

                socket.emit("friendChatOpened", {
                    conversationId: conversation._id,
                    roomName,
                    messages: pastMessages.map((m) => ({
                        text: m.text,
                        fileUrl: m.fileUrl,
                        fileType: m.fileType,
                        fileName: m.fileName,
                        sender:
                            m.sender.toString() === socket.userId
                                ? "me"
                                : "friend",
                        timestamp: m.createdAt.getTime(),
                    })),
                });

            } catch (error) {

                console.error("OPEN FRIEND CHAT ERROR:", error);

            }

        });

        socket.on(
            "sendFriendMessage",
            async ({ conversationId, roomName, text, fileUrl, fileType, fileName }) => {

                if (!socket.userId) return;
                if (!text?.trim() && !fileUrl) return;

                if (fileUrl && !socket.isPremium) {
                    socket.emit("friendMediaBlocked");
                    return;
                }

                try {

                    const message = await Message.create({
                        conversation: conversationId,
                        sender: socket.userId,
                        text: text?.trim() || "",
                        fileUrl: fileUrl || null,
                        fileType: fileType || null,
                        fileName: fileName || null,
                    });

                    const conversation = await Conversation.findById(conversationId);

                    const recipientId = conversation?.participants
                        .map((p) => p.toString())
                        .find((id) => id !== socket.userId);

                    // A recipient counts as "already read" only if their
                    // socket is actually sitting in this friend room right
                    // now (chat window open) at the moment we send.
                    const roomMemberIds = [
                        ...(io.sockets.adapter.rooms.get(roomName) || []),
                    ];

                    const recipientViewing = roomMemberIds.some(
                        (id) => io.sockets.sockets.get(id)?.userId === recipientId
                    );

                    if (conversation) {

                        conversation.lastMessageAt = message.createdAt;
                        conversation.lastMessagePreview =
                            message.text || (message.fileUrl ? "📎 Attachment" : "");
                        conversation.readBy = recipientViewing
                            ? [socket.userId, recipientId]
                            : [socket.userId];

                        await conversation.save();

                    }

                    // Live update for whoever currently has this chat open
                    socket.to(roomName).emit("receiveFriendMessage", {
                        conversationId,
                        text: message.text,
                        fileUrl: message.fileUrl,
                        fileType: message.fileType,
                        fileName: message.fileName,
                        senderId: socket.userId,
                        timestamp: message.createdAt.getTime(),
                    });

                    // Friends-list update (unread dot + reorder to top) —
                    // sent to the recipient's personal room so it arrives
                    // even if they don't have this chat open right now
                    if (recipientId && !recipientViewing) {

                        io.to(`user-${recipientId}`).emit("friendMessageNotification", {
                            conversationId,
                            senderId: socket.userId,
                            preview:
                                message.text || (message.fileUrl ? "📎 Attachment" : ""),
                            timestamp: message.createdAt.getTime(),
                        });

                    }

                } catch (error) {

                    console.error("SEND FRIEND MESSAGE ERROR:", error);

                }

            }
        );

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

                if (socket.userId) {

                    // Give this user a chance to reconnect before
                    // permanently tearing down the room
                    const roomData = getRoom(room);

                    const partnerSocketId = roomData?.users.find(
                        (id) => id !== socket.id
                    );

                    const timer = setTimeout(() => {

                        pendingReconnects.delete(socket.userId);
                        roomSharedTags.delete(room);
                        removeRoom(room);

                        if (partnerSocketId) {
                            userRooms.delete(partnerSocketId);
                        }

                    }, RECONNECT_GRACE_MS);

                    pendingReconnects.set(socket.userId, {
                        room,
                        partnerSocketId,
                        oldSocketId: socket.id,
                        timer,
                    });

                } else {

                    // No resolved identity — can't verify a returning
                    // user is the same person, so end the chat for good
                    roomSharedTags.delete(room);
                    removeRoom(room);

                }
            }

            userRooms.delete(socket.id);
            removeFromQueue(socket.id);
            socketInterests.delete(socket.id);
            socketGenderPreference.delete(socket.id);
            lastSkipped.delete(socket.id);
            socketProfiles.delete(socket.id);
            removeUser(socket.id);

            if (socket.userId) {

                const remaining =
                    (onlineUserCounts.get(socket.userId) || 1) - 1;

                if (remaining <= 0) {
                    onlineUserCounts.delete(socket.userId);
                    broadcastFriendPresence(io, socket.userId, false);
                } else {
                    onlineUserCounts.set(socket.userId, remaining);
                }

            }

            io.emit(
                "onlineUsers",
                getOnlineCount()
            );
        });

    });

}
