import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Either text or a file attachment (or both) should be present —
        // enforced in the socket handler rather than here
        text: {
            type: String,
            default: "",
        },

        fileUrl: {
            type: String,
            default: null,
        },

        fileType: {
            type: String,
            enum: ["image", "video", "file", null],
            default: null,
        },

        fileName: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.models.Message ||
    mongoose.model("Message", messageSchema);
