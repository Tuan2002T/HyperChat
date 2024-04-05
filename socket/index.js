
// const { Server } = require("socket.io");

// const io = new Server();

// // Lưu trữ danh sách các phòng chat
// const rooms = [];

// io.on('connection', (socket) => {
//   console.log('A user connected', socket.id);

//   // Xử lý khi client tham gia phòng chat
//   socket.on('joinRoom', (roomId) => {
//     const room = rooms.find(r => r.id === roomId) || { id: roomId, clients: [] };
//     room.clients.push(socket.id);
//     console.log("rooms", room);
//     socket.join(roomId);
//     console.log(`Client ${socket.id} joined room ${roomId}`);
//   });

//   // Lắng nghe sự kiện gửi tin nhắn từ client
//   socket.on('sendMessage', (data) => {
//     const { roomId, message, senderId, createdAt  } = data;

//     // Phát sóng tin nhắn đến tất cả các client trong cùng phòng chat
//     io.to(roomId).emit('receiveMessage', { message, senderId, createdAt  });
//     console.log(`Message sent to room ${roomId}: ${message} (from ${senderId})`);
//   });
//   socket.on('getRoomList', () => {
//     socket.emit('roomList', rooms);
//   });
//   // Xử lý khi client ngắt kết nối
//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//     // Xóa client khỏi các phòng chat
//     rooms.forEach(room => {
//       room.clients = room.clients.filter(client => client !== socket.id);
//     });
//   });
// });

// const PORT = 3000;
// io.listen(PORT);
// console.log(`Server is running on port ${PORT}`);


const { Server } = require("socket.io");

const io = new Server();

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

  socket.on('listOnlineUsers', () => {
    socket.emit('onlineUsers', onlineUsers.map(user => user.userId));
  });


  socket.on('joinRoom', (roomId, members) => {
    const room = rooms[roomId];
    if (room) {
      members.forEach(member => {
        if (!room.members.includes(member)) {
          room.members.push(member);
        }
      });
      room.socket.push(socket.id);
    } else {
      rooms[roomId] = { members, socket: [socket.id] };
    }
    socket.join(roomId);
    console.log(`Người dùng ${socket.id} đã tham gia phòng chat ${roomId}`);
    console.log('Danh sách phòng chat : ', rooms);
});



  socket.on('sendMessage', ({ roomId, message, senderId, createdAt }) => {
    console.log(`Người dùng ${senderId} đã gửi tin nhắn trong phòng chat ${roomId}: ${message}`);
    io.to(roomId).emit('receiveMessage', { message, senderId, createdAt});
  });

  socket.on('sendNotification', ({ roomId, notification }) => {
    const room = rooms[roomId];
    if (room) {
      room.members.forEach(member => {
        if (room.socket.includes(member.socketId)) {
          io.to(member.socketId).emit('receiveNotification', notification);
          console.log(`Đã gửi thông báo đến người dùng ${member.userId} trong phòng chat ${roomId}`);
        }
      }
      );
    }
  }
  );

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
  

  // Bắt sự kiện ngắt kết nối của người dùng
  socket.on('disconnect', () => {
    console.log('Người dùng ngắt kết nối : ', socket.id);
    // Loại bỏ người dùng khỏi danh sách người dùng trực tuyến
    const index = onlineUsers.findIndex(user => user.id === socket.id);
    if (index !== -1) {
      onlineUsers.splice(index, 1);
      io.emit('onlineUsers', onlineUsers.map(user => user.userId)); // Cập nhật danh sách người dùng trực tuyến tới tất cả client
    }
    console.log('Danh sách người dùng trực tuyến : ', onlineUsers.map(user => user.userId));
  });
});

const PORT = 3000;
io.listen(PORT);
console.log(`Server is running on port ${PORT}`);