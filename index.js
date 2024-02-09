// server.js

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const helmet = require("helmet");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Use helmet middleware for security headers
app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://example.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: "same-origin" }));

// Serve chat page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Middleware untuk menangani file statis dengan benar
app.use(express.static(__dirname + "/public"));

// Store connected users
const users = {};

// Listen for socket.io connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Listen for chat messages dengan validasi input
  socket.on("chat message", (msg) => {
    const username = users[socket.id] || "Anonymous";
    const message = `${username}: ${msg}`;
    console.log("Message:", message);
    // Broadcast message to all connected clients
    io.emit("chat message", message);
  });

  // Listen for username change
  socket.on("change username", (username) => {
    if (usernameIsAvailable(username)) {
      users[socket.id] = username;
      io.emit("user joined", username);
      // Send updated user list to all clients
      io.emit("user list", Object.values(users));
    } else {
      socket.emit("username error", "Username is already in use");
    }
  });

  // Listen for disconnections
  socket.on("disconnect", () => {
    const username = users[socket.id];
    delete users[socket.id];
    if (username) {
      io.emit("user left", username);
      // Send updated user list to all clients
      io.emit("user list", Object.values(users));
    }
    console.log("User disconnected");
  });

  // Listen for private messages
  socket.on("private message", ({ recipient, message }) => {
    const sender = users[socket.id] || "Anonymous";
    const recipientSocketId = Object.keys(users).find(
      (id) => users[id] === recipient
    );
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("private message", {
        sender,
        message,
      });
      socket.emit("private message", {
        sender,
        message,
        self: true,
      });
    } else {
      socket.emit("private error", "User not found");
    }
  });

  // Listen for image messages
  socket.on("image", (image) => {
    const username = users[socket.id] || "Anonymous";
    // Broadcast image to all connected clients
    io.emit("image", { username, image });
  });

  // Fungsi untuk memeriksa ketersediaan username
  function usernameIsAvailable(username) {
    return !Object.values(users).includes(username);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
