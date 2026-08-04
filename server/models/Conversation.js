import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],

        // true = a permanent friend DM thread (messages get saved).
        // false/absent = an ephemeral random-stranger chat (never saved).
        isFriendChat: {
            type: Boolean,
            default: false,
        },

        startedAt: {
            type: Date,
            default: Date.now,
        },

        endedAt: {
            type: Date,
            default: null,
        },

        // Why the conversation ended, useful for history UI
        endedReason: {
            type: String,
            enum: ["skipped", "disconnected", "reported", null],
            default: null,
        },

        sharedTags: {
            type: [String],
            default: [],
        },

        // When the most recent message in this conversation was sent.
        // Used to sort the friends list (most recent DM first) without
        // having to query the Message collection just for ordering.
        lastMessageAt: {
            type: Date,
            default: null,
        },

        // Short preview of the most recent message, for future use in
        // the friends list (e.g. "Hey, you around?" under the name).
        lastMessagePreview: {
            type: String,
            default: "",
        },

        // Which participants have "read" the conversation as of
        // lastMessageAt. Reset to just [sender] every time a new
        // message is sent; a participant is added back in once they
        // open the chat. A friend is "unread" for a user when that
        // user's id is NOT in this array.
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // When each participant last opened this conversation, keyed by
        // their user id (as a string). Used to count exactly how many
        // messages arrived after that point, for a real unread NUMBER
        // in the friends list rather than just a boolean.
        lastReadAt: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ participants: 1 });

export default mongoose.models.Conversation ||
    mongoose.model("Conversation", conversationSchema);
