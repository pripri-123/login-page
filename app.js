const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const passport = require('passport');
const session = require('express-session');
const path = require("path");
const bcrypt = require("bcrypt");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");;
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require('./routes/jobRoutes');
const chatRoutes = require('./routes/chatRoutes');
const Chat = require("./models/Chat"); // Import Chat model
const User = require("./models/User"); // Import User model
const Job = require('./models/Job');


const app = express();
const server = http.createServer(app);
const io = socketIo(server);





const userSockets = {}; // Store user socket connections




// MongoDB Atlas Connection String
const mongoURI = 'mongodb+srv://vaishnavdv26:Waasup%402025@cluster0.iktas.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));


// Passport config
require("./config/passport")(passport);

// Middleware
// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the views directory (if your views are inside a 'views' folder)
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, images) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));




app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ 
  secret: 'secretkey', 
  resave: false, 
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: mongoURI }),
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/jobs', jobRoutes);
app.use("/chat", chatRoutes);




// Chat Functionality with MongoDB
io.on('connection', (socket) => {
    console.log('New user connected');

    // Store user socket connection
    socket.on("userConnected", (userId) => {
        userSockets[userId] = socket.id;
    });

    // Handle private messaging and save to MongoDB
    socket.on("privateMessage", async ({ senderId, receiverId, message }) => {
        try {
            // Save message in MongoDB
            const chatMessage = new Chat({ senderId, receiverId, message });
            await chatMessage.save();

            // Send message to receiver if online
            const receiverSocketId = userSockets[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receivePrivateMessage", { senderId, message });
            }
        } catch (error) {
            console.error("Error saving chat message:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        for (const [userId, socketId] of Object.entries(userSockets)) {
            if (socketId === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
    });
});


// Serve HTML pages
app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/jobs");
    } else {
        res.render("index"); // ✅ This should match `views/index.ejs`

    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user in database
    const user = await User.findOne({ username });

    if (!user) {
        return res.render('login', { error: 'User not found. Please sign up.' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.render('login', { error: 'Incorrect password. Try again.' });
    }

    // Store user session
    req.session.user = user;

    // Redirect to home page with welcome message
    res.redirect(`/home?username=${username}`);
});

// Job Listings Route
app.get('/job-listings', async (req, res) => {
    try {
        const jobs = await Job.find(); // Fetch all jobs from the database
        res.render('job-listings', { jobs });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching jobs");
    }
});


app.post('/signup', async (req, res) => {
    const { newUsername, newPassword, email } = req.body;

    try {
        // Check if username or email already exists
        const existingUser = await User.findOne({ 
            $or: [{ username: newUsername }, { email: email }] 
        });

        if (existingUser) {
            return res.render('index', { message: "Username or Email already exists. Try again!", messageType: "error" });
        }

        // Create a new user
        const newUser = new User({ username: newUsername, password: newPassword, email: email });
        await newUser.save();

        // Send success message
        res.render('index', { message: "Signup successful! You can now login.", messageType: "success" });

    } catch (error) {
        console.error(error);
        res.render('index', { message: "An error occurred. Please try again.", messageType: "error" });
    }
});


app.get('/home', (req, res) => {
    const username = req.query.username || 'Guest';
    res.render('home', { username });
});


// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'views/chat.ejs')));

// Fetch chat history between two users
app.get("/chat-history/:userId/:receiverId", async (req, res) => {
    const { userId, receiverId } = req.params;
    
    try {
        const messages = await Chat.find({
            $or: [
                { senderId: userId, receiverId: receiverId },
                { senderId: receiverId, receiverId: userId }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Error fetching messages" });
    }
});

// Authentication Routes
const router = express.Router();

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
}));

router.post('/signup', (req, res) => {
    // Handle user registration logic here
    res.redirect('/login');
});

router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

module.exports = User;
module.exports = router;

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

