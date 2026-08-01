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
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ participants: 1 });

export default mongoose.models.Conversation ||
    mongoose.model("Conversation", conversationSchema);
