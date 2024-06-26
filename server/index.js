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
  console.log('Người dùng kết nối : ', socket.id);

  socket.on('userOnline', (userId) => {
    console.log(`Người dùng ${userId} đã online`);
    onlineUsers.push({ id: socket.id, userId }); // Lưu trữ cả ID của socket và ID của người dùng
    io.emit('onlineUsers', onlineUsers.map(user => user.userId)); // Gửi danh sách người dùng trực tuyến tới tất cả client
    console.log('Danh sách người dùng trực tuyến : ', onlineUsers.map(user => user));
  });

  socket.on('userOffline', (userId) => {
    console.log(`Người dùng của socket ${userId} đã offline`);
    const index = onlineUsers.findIndex(user => user.userId === userId);
    if (index !== -1) {
      onlineUsers.splice(index, 1);
      io.emit('onlineUsers', onlineUsers.map(user => user.userId)); // Gửi danh sách người dùng trực tuyến tới tất cả client
    }
    console.log('Danh sách người dùng trực tuyến : ', onlineUsers.map(user => user.userId));
  }
  );

  socket.on('listOnlineUsers', () => {
    socket.emit('onlineUsers', onlineUsers.map(user => user.userId));
  });
  socket.on('userNewRegister', (us) => {
    console.log('user', us);
    onlineUsers.forEach(onlineUser => {
      console.log('onlineUser', onlineUser);
      io.to(onlineUser.id).emit('newUserRegister', us);
    });
  });

  socket.on('joinRoom', (roomId, members) => {
    console.log('roomId', roomId);
    console.log('members', members);
  
    // Kiểm tra nếu room đã tồn tại trong danh sách phòng
    const room = rooms[roomId];
    if (room) {
      // Thêm các thành viên vào room nếu họ chưa có trong danh sách members
      members.forEach(member => {
        if (!room.members.includes(member)) {
          room.members.push(member);
        }
      });
  
      // Kiểm tra nếu socket.id đã tồn tại trong room.socket thì không push
      if (!room.socket.includes(socket.id)) {
        room.socket.push(socket.id);
      }
    } else {
      // Tạo mới một phòng nếu phòng chưa tồn tại
      rooms[roomId] = {
        roomId: roomId, // Sử dụng roomId trực tiếp thay vì một đối tượng
        members: members,
        socket: [socket.id]
      };
    }
  
    // Tham gia phòng
    socket.join(roomId);
    console.log(`Người dùng ${socket.id} đã tham gia phòng chat ${roomId}`);
    console.log('Danh sách phòng chat : ', rooms);
  });
  

  socket.on('listRooms', () => {
    socket.emit('rooms', Object.values(rooms));  // Gửi danh sách các phòng chat về client
  });

  socket.on('sendMessage', ({ roomId, message, senderId, image, video, file, createdAt, messageId }) => {
    console.log(`Người dùng ${senderId} đã gửi tin nhắn trong phòng chat ${roomId}: ${message}`);
    console.log('messageId', messageId);
    console.log('room', rooms[roomId]);
    const room = rooms[roomId];

    if (!room) {
      console.log(`Phòng chat với ID ${roomId} không tồn tại hoặc không có người dùng online.`);
      // Có thể thêm hành động khác tại đây, ví dụ: gửi thông báo lỗi cho client
      return;
    }
    console.log('room', room.socket); 
    console.log('ảnh đã gửi', image);
    console.log('video đã gửi', video);
    console.log('Tin nhắn đã gửi', roomId, message, senderId, image, video, file, createdAt);
    room.socket.forEach(socketId => {
      io.to(socketId).emit('receiveMessage', { message, senderId, image, video, file, createdAt, messageId });
    });

    onlineUsers.forEach(user => {
      room.members.forEach(member => {
        if (member === user.userId && user.userId !== senderId) {
          io.to(user.id).emit('receiveNotification', {senderId, roomId, createdAt});
        }
      }
      );

    });
    onlineUsers.forEach(user => {
      room.members.forEach(member => {
        if (member === user.userId) {
          io.to(user.id).emit('sortChat', {senderId, roomId, createdAt});
        }
      }
      );

    });

  });

  socket.on('sendNotification', ({ roomId, senderId, text}) => {
    const room = rooms[roomId];
    if(!room) {
      console.log(`Phòng chat với ID ${roomId} không tồn tại hoặc không có người dùng online.`);
      return;
    }
    room.socket.forEach(socketId => {
      console.log('Text', text);
      io.to(socketId).emit('receiveMessageNotification', { senderId, text });
    });

    // onlineUsers.forEach(user => {
    //   room.members.forEach(member => {
    //     if (member === user.userId && user.userId !== senderId) {
    //       const mss = 'Bạn có thông báo mới từ ' + senderId;
    //       io.to(user.id).emit('receiveNotification', mss);
    //       console.log('Đã gửi thông báo đến người dùng', user.id + 'với nội dung ' + mss);
    //     }
    //   });
    // })
  });

  socket.on('retrieveMessages', ({ roomId, ms }) => {
    console.log('updatedMessages', ms);
    const room = rooms[roomId];
    room.socket.forEach(socketId => {
      io.to(socketId).emit('retrievedMessageRecall', ms);
    });
  });


  socket.on('deleteMessages', ({ roomId, updatedMessages }) => {
    console.log('updatedMessages', updatedMessages);
    const room = rooms[roomId];
    room.socket.forEach(socketId => {
      io.to(socketId).emit('deletedMessageRecall', updatedMessages);
    });
  });

  socket.on('deleteRoom', (roomId) => {
    delete rooms[roomId];
    console.log(`Đã xóa phòng chat ${roomId}`);
    console.log('Danh sách phòng chat : ', rooms);
  });

  socket.on('leaveRoom', (roomId) => {
    // Tìm phòng chat theo roomId
    const room = rooms[roomId];

    if (room) {
      // Loại bỏ socket ra khỏi danh sách socket của phòng chat
      const index = room.socket.indexOf(socket.id);
      if (index !== -1) {
        room.socket.splice(index, 1);
        console.log(`Socket ${socket.id} đã rời khỏi phòng chat ${roomId}`);
      }
    }
    console.log('Danh sách phòng chat : ', rooms);
  });

  socket.on('leaveAllRooms', () => {
    const socketId = socket.id;
  
    // Lặp qua danh sách các phòng chat
    Object.values(rooms).forEach(room => {
      // Loại bỏ socket ra khỏi danh sách socket của phòng chat
      const index = room.socket.indexOf(socketId);
      if (index !== -1) {
        room.socket.splice(index, 1);
        console.log(`Socket ${socketId} đã rời khỏi phòng chat ${room.roomId}`);
      }
    });
  
    console.log('Danh sách phòng chat : ', rooms);
  });


  // socket.on('sendFriendRequest', ({ senderId, receiverId }) => {
  //   // Tìm kiếm người dùng nhận yêu cầu kết bạn trong mảng onlineUsers
  //   const receiverSocket = onlineUsers.find(user => user.userId === receiverId);
  
  //   if (receiverSocket) {
  //     // Nếu người dùng nhận yêu cầu kết bạn đang trực tuyến
  //     const { socketId } = receiverSocket;
  
  //     // Gửi sự kiện 'receiveFriendRequest' tới socket của người dùng đó
  //     io.to(socketId).emit('receiveFriendRequest', senderId);
  
  //     console.log(`Đã gửi yêu cầu kết bạn từ ${senderId} tới ${receiverId}`);
  //   } else {
  //     // Nếu người dùng nhận yêu cầu kết bạn không trực tuyến
  //     console.log(`Người dùng ${receiverId} không trực tuyến`);
  //   }
  // });

  socket.on('sendFriendRequest', ({ senderId, receiverId }) => {
      if(onlineUsers.find(d => d.userId === receiverId)) {
        io.to(onlineUsers.find(user => user.userId === receiverId).id).emit('receiveFriendRequest', senderId);
        console.log(`Đã gửi yêu cầu kết bạn từ ${senderId} tới ${receiverId}`);
      }
  })

  socket.on('acceptFriendRequest', ({ senderId, receiverId }) => {
    const senderSocket = onlineUsers.find(user => user.userId === senderId);
    if (senderSocket) {
      io.to(senderSocket.id).emit('acceptedFriendRequest', receiverId);
      console.log(`Đã chấp nhận yêu cầu kết bạn từ ${receiverId} tới ${senderId}`);
    } else {
      console.log(`Người dùng ${senderId} không trực tuyến`);
    }
  });

  // socket.on('deleteFriendRequest', ({ senderId, receiverId }) => {
  //   const senderSocket = onlineUsers.find(user => user.userId === senderId);
  //   if (senderSocket) {
  //     io.to(senderSocket.id).emit('deletedFriendRequest', receiverId);
  //     console.log(`Đã xóa yêu cầu kết bạn từ ${receiverId} tới ${senderId}`);
  //   } else {
  //     console.log(`Người dùng ${senderId} không trực tuyến`);
  //   }
  // });

  socket.on('unFriend', ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.find(user => user.userId === receiverId);
    if (receiverSocket) {
      io.to(receiverSocket.id).emit('undedFriend', senderId);
      console.log(`Đã xóa bạn bè từ ${senderId} tới ${receiverId}`);
    } else {
      console.log(`Người dùng ${receiverId} không trực tuyến`);
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
          console.log('cần gửi đến đây ??');
          io.to(user.id).emit('addChatGroupForMember', roomId);
        }
      });
    });

    onlineUsers.forEach(user => {
      console.log('rooommmm', room.members);
      room.members.forEach(member => {
        if (member === user.userId) {
          io.to(user.id).emit('addChatGroupForMemberShow', members);
        }
      });
    });

    console.log(`Đã thêm thành viên vào phòng chat ${roomId}`);
  });
  socket.on('deleteMemberChatGroup', ({ roomId, members }) => {
    console.log('members', members);
    console.log('roomId', roomId);
    const room = rooms[roomId];
    members.forEach(member => {
      const index = room.members.indexOf(member);
      if (index !== -1) {
        room.members.splice(index, 1);
      }
    });
    onlineUsers.forEach(user => {
      members.forEach(member => {
        if (member === user.userId) {
          console.log('cần gửi đến đây neffff??');
          io.to(user.id).emit('deleteChatGroupForMember', roomId);
        }
      });
    });
    onlineUsers.forEach(user => {
      members.forEach(member => {
        if (member === user.userId) {
          console.log('cần gửi đến đây neffff??');
          io.to(user.id).emit('deletedChatGroupForMember', members);
        }
      });
    });

    onlineUsers.forEach(user => {
      room.members.forEach(member => {
        if (member === user.userId) {
          console.log('cần gửi đến đây neffff?>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
          io.to(user.id).emit('deleteChatGroupForMemberShow', members);
        }
      });
    });
    console.log(`Đã xóa thành viên khỏi phòng chat ${roomId}`);
  });


  socket.on('addAdmin', ({ roomId, members, chat }) => {

    console.log('chat', chat);
    console.log('members', members);
    console.log('roomId', roomId);
    const room = rooms[roomId];
    onlineUsers.forEach(user => {
      room.members.forEach(member => {
        if (member === user.userId) {
          console.log('cần gửi đến đây ??');
          io.to(user.id).emit('addAdminChatGroup', { members, roomId });
        }
      });
    });

    onlineUsers.forEach(user => {
      members.forEach(member => {
        if (member === user.userId) {
          console.log('cần gửi đến đây ??');
          io.to(user.id).emit('addAdminChatGroupForMember', chat);
        }
      });
    }
    );
  });

  socket.on('deleteAdmin', ({ roomId, members, chat }) => {
    const room = rooms[roomId];
    onlineUsers.forEach(user => {
      room.members.forEach(member => {
        if (member === user.userId) {
          io.to(user.id).emit('deleteAdminChatGroup', { members, roomId });
        }
      });
    });

    onlineUsers.forEach(user => {
      members.forEach(member => {
        if (member === user.userId) {
          console.log('cần gửi đến đây ??');
          io.to(user.id).emit('deleteAdminChatGroupForMember', chat);
        }
      });
    }
    );
  });

  socket.on('outGroup', ({ roomId, currentId }) => {
    const room = rooms[roomId];
    const index = room.members.indexOf(currentId);
    const socketIndex = room.socket.indexOf(socket.id);
    if (socketIndex !== -1) {
      room.socket.splice(socketIndex, 1);
    }
    if (index !== -1) {
      room.members.splice(index, 1);
    }
    console.log('roommmmm', room);
    onlineUsers.forEach(user => {
      if (currentId === user.userId) {
        io.to(user.id).emit('outedGroup', roomId);
      }
    });
  })

  socket.on('deleteGroup', ({ roomId, name }) => {
    const room = rooms[roomId];
    room.socket.forEach(socketId => {
      io.to(socketId).emit('deletedGroup', roomId);
    });
    onlineUsers.forEach(user => {
      room.members.forEach(member => {
        if (member === user.userId) {
          io.to(user.id).emit('deletedGroupForMember', {name, roomId});
        }
      });
    });
    delete rooms[roomId];
  });

  socket.on('createChat', ({ newChat }) => {
    console.log('newChat', newChat);
    onlineUsers.forEach(user => {
      newChat.members.forEach(member => {
        if (member === user.userId) {
          io.to(user.id).emit('createdChat', newChat);
        }
      });
    });
  });

  socket.on('createGroup', ({ newGroup }) => {
    console.log('newGroup', newGroup);
    onlineUsers.forEach(user => {
      newGroup.members.forEach(member => {
        if (member === user.userId) {
          io.to(user.id).emit('createdGroup', newGroup);
        }
      });
    });
  });

  // Bắt sự kiện ngắt kết nối của người dùng
  socket.on('disconnect', () => {
    console.log('Người dùng ngắt kết nối : ', socket.id);
    // Loại bỏ người dùng khỏi danh sách người dùng trực tuyến
    const index = onlineUsers.findIndex(user => user.id === socket.id);
    if (index !== -1) {
      onlineUsers.splice(index, 1);
      io.emit('onlineUsers', onlineUsers.map(user => user.userId)); // Cập nhật danh sách người dùng trực tuyến tới tất cả client
    }

    rooms.forEach(room => {
      if (room.socket.length <= 0)
        socket.emit('deleteRoom', room.id)
    });
    console.log('Thiết bị đã ngắt kểt nối')
    console.log('Danh sách người dùng trực tuyến : ', onlineUsers.map(user => user.userId));
  });
});

http.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
