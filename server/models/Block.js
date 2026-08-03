import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
    {
        blocker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        blocked: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// One block record per (blocker, blocked) pair
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export default mongoose.models.Block ||
    mongoose.model("Block", blockSchema);
