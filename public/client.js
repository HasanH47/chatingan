// public/client.js

document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  const form = document.getElementById("form");
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");
  const userList = document.getElementById("user-list");
  const privateForm = document.getElementById("private-form");
  const privateInput = document.getElementById("private-input");
  const imageForm = document.getElementById("image-form");
  const imageInput = document.getElementById("image-input");

  let username = null;

  // Function to prompt for username
  function promptForUsername() {
    // Welcome
    alert("Welcome to Chatingan!");
    // Prompt for username
    username = prompt("Enter your username:");
    if (!username) {
      // If username is not provided, prompt again
      promptForUsername();
    } else {
      // Emit change username event
      socket.emit("change username", username);
    }
  }

  // Call promptForUsername function to initiate username prompt
  promptForUsername();

  // Socket event listeners
  socket.on("username error", (error) => {
    alert(error);
    promptForUsername();
  });

  // Event listener for form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
      socket.emit("chat message", input.value);
      input.value = "";
    }
  });

  // Event listener for private message form submission
  privateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (privateInput.value) {
      const recipient = privateForm.recipient.value;
      socket.emit("private message", {
        recipient,
        message: privateInput.value,
      });
      privateInput.value = "";
    }
  });

  // Event listener for image upload form submission
  imageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const file = imageInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        socket.emit("image", e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // Socket event listeners
  socket.on("chat message", (msg) => {
    const item = document.createElement("li");
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });

  socket.on("user joined", (username) => {
    const item = document.createElement("li");
    item.textContent = `${username} joined the chat`;
    item.classList.add("info");
    messages.appendChild(item);
  });

  socket.on("user left", (username) => {
    const item = document.createElement("li");
    item.textContent = `${username} left the chat`;
    item.classList.add("info");
    messages.appendChild(item);
  });

  socket.on("user list", (users) => {
    userList.innerHTML = "";
    users.forEach((user) => {
      const item = document.createElement("li");
      item.textContent = user;
      userList.appendChild(item);
    });
  });

  socket.on("private message", ({ sender, message, self }) => {
    const item = document.createElement("li");
    item.textContent = `${self ? "You" : sender}: ${message} (Private)`;
    item.classList.add("private");
    messages.appendChild(item);
  });

  socket.on("private error", (error) => {
    alert(error);
  });

  socket.on("image", ({ username, image }) => {
    const item = document.createElement("li");
    const img = document.createElement("img");
    img.src = image;
    item.textContent = username + ": ";
    item.appendChild(img);
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });
});
