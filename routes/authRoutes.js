const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");

const router = express.Router();
// Route: Display sign-up form
router.get("/signup", (req, res) => {
    res.render("signup");
});


// Signup Route
router.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        let user = await User.findOne({ username });

        if (user) {
            return res.send("User already exists. Try logging in.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ username, password: hashedPassword });
        await user.save();

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});


// Route: Display login form
router.get("/login", (req, res) => {
    res.render("login");
});

// Route: Handle login
router.post("/login", passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
}));

// Route: Display dashboard (Only if logged in)
router.get("/dashboard", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/login");
    res.send(`<h1>Welcome ${req.user.name}!</h1> <a href="/logout">Logout</a>`);
});

// Route: Logout
router.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/login");
    });
});

module.exports = router;
