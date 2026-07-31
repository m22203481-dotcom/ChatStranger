import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        authProvider: {
            type: String,
            enum: ["google", "anonymous"],
            required: true,
        },

        // GOOGLE USERS ONLY
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        email: {
            type: String,
            unique: true,
            sparse: true,
        },

        // ANONYMOUS USERS ONLY
        // A long-lived random token stored in the browser (cookie/localStorage)
        // so a returning anonymous visitor keeps the same identity + history
        anonymousToken: {
            type: String,
            unique: true,
            sparse: true,
        },

        // Shown in the UI for both provider types.
        // Google: pulled from their Google profile name.
        // Anonymous: randomly generated (e.g. "Silent Fox"), regenerated
        // only if the user explicitly asks for a new one.
        displayName: {
            type: String,
            required: true,
        },

        avatarUrl: {
            type: String,
            required: true,
        },

        gender: {
            type: String,
            enum: ["male", "female", "other", null],
            default: null,
        },

        // PREMIUM / STRIPE
        isPremium: {
            type: Boolean,
            default: false,
        },

        stripeCustomerId: {
            type: String,
            default: null,
        },

        stripeSubscriptionId: {
            type: String,
            default: null,
        },

        premiumExpiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.User ||
    mongoose.model("User", userSchema);
