const express = require("express");
const Chat = require("../models/Chat");
const { ensureAuthenticated } = require("../middlewares/authMiddleware");

const router = express.Router();

// GET Chat Page (Only for logged-in users)
router.get("/", ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const chats = await Chat.find({ 
            $or: [{ senderId: userId }, { receiverId: userId }]
        }).populate("senderId receiverId", "username");

        res.render("chat", { user: req.user, chats });
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).send("Server Error");
    }
});

// POST Send a Private Message
router.post("/send", ensureAuthenticated, async (req, res) => {
    try {
        const { receiverId, message } = req.body;
        const senderId = req.user._id;

        if (!receiverId || !message.trim()) {
            return res.status(400).json({ error: "Receiver and message are required" });
        }

        const newMessage = new Chat({
            senderId,
            receiverId,
            message
        });

        await newMessage.save();

        res.status(200).json({ success: true, message: "Message sent" });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// GET Chat History with a Specific User
router.get("/history/:userId", ensureAuthenticated, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Chat.find({
            $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
