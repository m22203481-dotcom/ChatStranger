import express from "express";
import User from "../models/User.js";
import {
    generateDisplayName,
    generateAvatarUrl,
} from "../utils/randomIdentity.js";
import crypto from "crypto";

const router = express.Router();

// POST /api/auth/anonymous
// Body: { token?: string } — an existing anonymousToken, if the browser has one
// Returns: { token, userId, displayName, avatarUrl, gender, isPremium }
router.post("/anonymous", async (req, res) => {

    try {

        const { token } = req.body || {};

        // Returning anonymous visitor — look up their existing account
        if (token) {

            const existingUser = await User.findOne({
                authProvider: "anonymous",
                anonymousToken: token,
            });

            if (existingUser) {

                return res.json({
                    token: existingUser.anonymousToken,
                    userId: existingUser._id,
                    displayName: existingUser.displayName,
                    avatarUrl: existingUser.avatarUrl,
                    gender: existingUser.gender,
                    isPremium: existingUser.isPremium,
                });

            }

            // Token was sent but doesn't match any account (expired /
            // tampered / DB reset) — fall through and create a fresh one
        }

        // New anonymous visitor
        const newToken = crypto.randomBytes(24).toString("hex");
        const displayName = generateDisplayName();
        const avatarUrl = generateAvatarUrl(newToken);

        const newUser = await User.create({
            authProvider: "anonymous",
            anonymousToken: newToken,
            displayName,
            avatarUrl,
        });

        return res.json({
            token: newUser.anonymousToken,
            userId: newUser._id,
            displayName: newUser.displayName,
            avatarUrl: newUser.avatarUrl,
            gender: newUser.gender,
            isPremium: newUser.isPremium,
        });

    } catch (error) {

        console.error("ANONYMOUS AUTH ERROR:", error);

        res.status(500).json({
            error: "Could not create anonymous session",
        });

    }

});

// POST /api/auth/anonymous/regenerate
// Body: { token: string } — gives the same account a new random name + avatar
router.post("/anonymous/regenerate", async (req, res) => {

    try {

        const { token } = req.body || {};

        if (!token) {
            return res.status(400).json({ error: "Missing token" });
        }

        const user = await User.findOne({
            authProvider: "anonymous",
            anonymousToken: token,
        });

        if (!user) {
            return res.status(404).json({ error: "Session not found" });
        }

        user.displayName = generateDisplayName();
        user.avatarUrl = generateAvatarUrl(
            crypto.randomBytes(8).toString("hex")
        );

        await user.save();

        return res.json({
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
        });

    } catch (error) {

        console.error("REGENERATE IDENTITY ERROR:", error);

        res.status(500).json({
            error: "Could not regenerate identity",
        });

    }

});

export default router;
