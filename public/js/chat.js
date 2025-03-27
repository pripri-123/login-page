document.addEventListener("DOMContentLoaded", () => {
    const socket = io();
    const messageForm = document.getElementById("message-form");
    const messageInput = document.getElementById("message-input");
    const messageList = document.getElementById("message-list");
    const userList = document.getElementById("user-list"); // Dropdown to select users
    const senderId = localStorage.getItem("userId"); // Assume user ID is stored in localStorage
    let receiverId = null; // Will be set when selecting a chat

    // Load available users for chat
    function loadUsers() {
        fetch("/users")
            .then(res => res.json())
            .then(users => {
                userList.innerHTML = '<option value="">Select a user</option>';
                users.forEach(user => {
                    if (user._id !== senderId) {
                        const option = document.createElement("option");
                        option.value = user._id;
                        option.textContent = user.username;
                        userList.appendChild(option);
                    }
                });
            })
            .catch(err => console.error("Error loading users:", err));
    }

    // Load previous chat history
    function loadChatHistory() {
        if (!senderId || !receiverId) return;

        fetch(`/chat-history/${senderId}/${receiverId}`)
            .then(res => res.json())
            .then(messages => {
                messageList.innerHTML = "";
                messages.forEach(msg => {
                    const messageItem = document.createElement("li");
                    messageItem.textContent = msg.senderId === senderId 
                        ? `You: ${msg.message}` 
                        : `Them: ${msg.message}`;
                    messageList.appendChild(messageItem);
                });
            })
            .catch(err => console.error("Error loading chat history:", err));
    }

    // Send a new message
    messageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!senderId || !receiverId || message === "") return alert("Please select a user and type a message.");

        socket.emit("privateMessage", { senderId, receiverId, message });

        // Append the message locally
        const messageItem = document.createElement("li");
        messageItem.textContent = `You: ${message}`;
        messageList.appendChild(messageItem);

        messageInput.value = "";
    });

    // Receive private messages
    socket.on("receivePrivateMessage", (data) => {
        if (data.senderId === receiverId) { // Only append if it's from the current chat
            const messageItem = document.createElement("li");
            messageItem.textContent = `Them: ${data.message}`;
            messageList.appendChild(messageItem);
        }
    });

    // When a user selects a chat
    userList.addEventListener("change", (e) => {
        receiverId = e.target.value;
        if (receiverId) {
            loadChatHistory();
        }
    });

    // Load users when the page loads
    loadUsers();
});


