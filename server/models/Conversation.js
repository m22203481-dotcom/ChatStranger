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
