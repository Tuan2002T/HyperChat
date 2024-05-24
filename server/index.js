const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");

const userRoute = require("./Routes/userRoute");
const chatRoute = require("./Routes/chatRoute");
const messageRoute = require("./Routes/messageRoute");
const friendsRouter = require("./Routes/friendsRouter");

const app = express();
require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use("/api/user", userRoute);
app.use("/api/chat", chatRoute);
app.use("/api/message", messageRoute);
app.use("/api/friends", friendsRouter);

const port = process.env.PORT || 5000;
const uri = process.env.ATLATS_URI;

// Create HTTP server and integrate with Socket.io
const http = require('http').createServer(app);
const { Server } = require("socket.io");

const io = new Server(http, {
  cors: {
    origin: "*", // Allow connections from all origins
    methods: ["GET", "POST"] // Allow HTTP methods
  }
});

mongoose.connect(uri).then(() => {
  console.log("Database connected...");
}).catch((err) => console.log("MongoDB connection failed: ", err.message));

app.get("/", (req, res) => {
  console.log("Welcome to HyperChat...!", req.session);
  res.send("Welcome to HyperChat...!");
});

const onlineUsers = [];
const rooms = [];

io.on('connection', (socket) => {
  console.log('User connected: ', socket.id);

  socket.on('userOnline', (userId) => {
    console.log(`User ${userId} is online`);
    onlineUsers.push({ id: socket.id, userId });
    io.emit('onlineUsers', onlineUsers.map(user => user.userId));
    console.log('Online users: ', onlineUsers.map(user => user.userId));
  });

  socket.on('userOffline', (userId) => {
    console.log(`User ${userId} is offline`);
    const index = onlineUsers.findIndex(user => user.userId === userId);
    if (index !== -1) {
      onlineUsers.splice(index, 1);
      io.emit('onlineUsers', onlineUsers.map(user => user.userId));
    }
    console.log('Online users: ', onlineUsers.map(user => user.userId));
  });

  socket.on('listOnlineUsers', () => {
    socket.emit('onlineUsers', onlineUsers.map(user => user.userId));
  });

  socket.on('userNewRegister', (us) => {
    console.log('user', us);
    onlineUsers.forEach(onlineUser => {
      io.to(onlineUser.id).emit('newUserRegister', us);
    });
  });

  socket.on('joinRoom', (roomId, members) => {
    const room = rooms[roomId];
    if (room) {
      members.forEach(member => {
        if (!room.members.includes(member)) {
          room.members.push(member);
        }
      });
      if (!room.socket.includes(socket.id)) {
        room.socket.push(socket.id);
      }
    } else {
      rooms[roomId] = {
        roomId,
        members,
        socket: [socket.id]
      };
    }

    socket.join(roomId);
    console.log(`User ${socket.id} joined chat room ${roomId}`);
    console.log('Chat rooms: ', rooms);
  });

  socket.on('listRooms', () => {
    socket.emit('rooms', Object.values(rooms));
  });

  socket.on('sendMessage', ({ roomId, message, senderId, image, video, file, createdAt, messageId }) => {
    console.log(`User ${senderId} sent message in chat room ${roomId}: ${message}`);
    const room = rooms[roomId];
    if (!room) {
      console.log(`Chat room with ID ${roomId} does not exist or has no online users.`);
      return;
    }
    room.socket.forEach(socketId => {
      io.to(socketId).emit('receiveMessage', { message, senderId, image, video, file, createdAt, messageId });
    });

    onlineUsers.forEach(user => {
      room.members.forEach(member => {
        if (member === user.userId && user.userId !== senderId) {
          io.to(user.id).emit('receiveNotification', { senderId, roomId, createdAt });
        }
      });
    });

    onlineUsers.forEach(user => {
      room.members.forEach(member => {
        if (member === user.userId) {
          io.to(user.id).emit('sortChat', { senderId, roomId, createdAt });
        }
      });
    });
  });

  socket.on('sendNotification', ({ roomId, senderId, text }) => {
    const room = rooms[roomId];
    if (!room) {
      console.log(`Chat room with ID ${roomId} does not exist or has no online users.`);
      return;
    }
    room.socket.forEach(socketId => {
      io.to(socketId).emit('receiveMessageNotification', { senderId, text });
    });
  });

  socket.on('retrieveMessages', ({ roomId, ms }) => {
    const room = rooms[roomId];
    room.socket.forEach(socketId => {
      io.to(socketId).emit('retrievedMessageRecall', ms);
    });
  });

  socket.on('deleteMessages', ({ roomId, updatedMessages }) => {
    const room = rooms[roomId];
    room.socket.forEach(socketId => {
      io.to(socketId).emit('deletedMessageRecall', updatedMessages);
    });
  });

  socket.on('deleteRoom', (roomId) => {
    delete rooms[roomId];
    console.log(`Deleted chat room ${roomId}`);
    console.log('Chat rooms: ', rooms);
  });

  socket.on('leaveRoom', (roomId) => {
    const room = rooms[roomId];
    if (room) {
      const index = room.socket.indexOf(socket.id);
      if (index !== -1) {
        room.socket.splice(index, 1);
        console.log(`Socket ${socket.id} left chat room ${roomId}`);
      }
    }
    console.log('Chat rooms: ', rooms);
  });

  socket.on('leaveAllRooms', () => {
    const socketId = socket.id;
    Object.values(rooms).forEach(room => {
      const index = room.socket.indexOf(socketId);
      if (index !== -1) {
        room.socket.splice(index, 1);
        console.log(`Socket ${socketId} left chat room ${room.roomId}`);
      }
    });
    console.log('Chat rooms: ', rooms);
  });

  socket.on('sendFriendRequest', ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.find(user => user.userId === receiverId);
    if (receiverSocket) {
      io.to(receiverSocket.id).emit('receiveFriendRequest', senderId);
      console.log(`Sent friend request from ${senderId} to ${receiverId}`);
    } else {
      console.log(`User ${receiverId} is not online`);
    }
  });

  socket.on('acceptFriendRequest', ({ senderId, receiverId }) => {
    const senderSocket = onlineUsers.find(user => user.userId === senderId);
    if (senderSocket) {
      io.to(senderSocket.id).emit('acceptedFriendRequest', receiverId);
      console.log(`Accepted friend request from ${receiverId} to ${senderId}`);
    } else {
      console.log(`User ${senderId} is not online`);
    }
  });

  socket.on('unFriend', ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.find(user => user.userId === receiverId);
    if (receiverSocket) {
      io.to(receiverSocket.id).emit('undedFriend', senderId);
      console.log(`Unfriended ${receiverId} from ${senderId}`);
    } else {
      console.log(`User ${receiverId} is not online`);
    }
  });

  socket.on('addMemberChatGroup', ({ roomId, members }) => {
    const room = rooms[roomId];
    members.forEach(member => {
      if (!room.members.includes(member)) {
        room.members.push(member);
      }
    });
    room.socket.forEach(socketId => {
      io.to(socketId).emit('addedMemberChatGroup', roomId);
    });

    onlineUsers.forEach(user => {
      members.forEach(member => {
        if (member === user.userId) {
          io.to(user.id).emit('addChatGroupForMember', roomId);
        }
      });
    });

    onlineUsers.forEach(user => {
      room.members.forEach(member => {
        if (member === user.userId) {
          io.to(user.id).emit('addChatGroupForMemberShow', members);
        }
      });
    });

    console.log(`Added members to chat room ${roomId}`);
  });

  socket.on('deleteMemberChatGroup', ({ roomId, members }) => {
    const room = rooms[roomId];
    members.forEach(member => {
      const index = room.members.indexOf(member);
      if (index !== -1) {
        room.members.splice(index, 1);
      }
    });
    onlineUsers.forEach(user => {
      room.members.forEach(member => {
        if (member === user.userId) {
          io.to(user.id).emit('deletedMemberChatGroup', roomId);
        }
      });
    });
    console.log(`Deleted members from chat room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ', socket.id);
    const index = onlineUsers.findIndex(user => user.id === socket.id);
    if (index !== -1) {
      onlineUsers.splice(index, 1);
      io.emit('onlineUsers', onlineUsers.map(user => user.userId));
    }
    Object.values(rooms).forEach(room => {
      const idx = room.socket.indexOf(socket.id);
      if (idx !== -1) {
        room.socket.splice(idx, 1);
        console.log(`Socket ${socket.id} left chat room ${room.roomId}`);
      }
    });
    console.log('Online users: ', onlineUsers.map(user => user.userId));
    console.log('Chat rooms: ', rooms);
  });
});

http.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
