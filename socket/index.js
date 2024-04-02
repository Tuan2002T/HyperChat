// const { Server } = require("socket.io");

// const socketIO  = new Server({ 
//   cors: {
//     origin: "*"
//   }
// });

// function createUniqueId() {
//   return Math.random().toString(20).substring(2, 10);
// }

// let chatgroups = [];


// socketIO.on("connection", (socket) => {
//   console.log(`${socket.id} user is just connected`);

//   socket.on("getAllGroups", () => {
//     socket.emit("groupList", chatgroups);
//   });

//   socket.on("createNewGroup", (currentGroupName) => {
//     console.log("id" ,currentGroupName);
//     chatgroups.unshift({
//       id: chatgroups.length + 1,
//       currentGroupName,
//       messages: [],
//     });
//     socket.emit("groupList", chatgroups);
//   });
//   socket.on("findGroup", (id) => {
//     const filteredGroup = chatgroups.filter((item) => item.id === id);
//     // socket.emit("foundGroup", filteredGroup[0].messages);
//   });

//   socket.on("newChatMessage", (data) => {
//     const { currentChatMesage, groupIdentifier, currentUser, timeData } = data;
//     const filteredGroup = chatgroups.filter(
//       (item) => item.id === groupIdentifier
//     );
//     const newMessage = {
//       id: createUniqueId(),
//       text: currentChatMesage,
//       currentUser,
//       time: `${timeData.hr}:${timeData.mins}`,
//     };

//     socket
//       .to(filteredGroup[0].currentGroupName)
//       .emit("groupMessage", newMessage);
//     filteredGroup[0].messages.push(newMessage);
//     socket.emit("groupList", chatgroups);
//     socket.emit("foundGroup", filteredGroup[0].messages);
//   });
// });
// socketIO .listen(3000);

// const { Server } = require("socket.io");

// const io = new Server();

// io.on("connection", (socket) => {
//   console.log("A user connected");

//   // Lắng nghe sự kiện gửi tin nhắn từ client
//   socket.on("sendMessage", (data) => {
//     const { message, sender } = data;
//     console.log(`Received message from ${sender}: ${message}`);

//     // Gửi tin nhắn đến tất cả các client khác
//     socket.broadcast.emit("receiveMessage", { message, sender });
//   });

//   // Xử lý khi client ngắt kết nối
//   socket.on("disconnect", () => {
//     console.log("A user disconnected");
//   });
// });

// const PORT = 3000;
// io.listen(PORT);
// console.log(`Server is running on port ${PORT}`);

const { Server } = require("socket.io");

const io = new Server();

// Lưu trữ danh sách các phòng chat
const rooms = [];

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Xử lý khi client tham gia phòng chat
  socket.on('joinRoom', (roomId) => {
    const room = rooms.find(r => r.id === roomId) || { id: roomId, clients: [] };
    room.clients.push(socket.id);
    console.log("rooms", room.client);
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  });

  // Lắng nghe sự kiện gửi tin nhắn từ client
  socket.on('sendMessage', (data) => {
    const { roomId, message, senderId } = data;

    // Phát sóng tin nhắn đến tất cả các client trong cùng phòng chat
    io.to(roomId).emit('receiveMessage', { message, senderId });
    console.log(`Message sent to room ${roomId}: ${message} (from ${senderId})`);
  });
  socket.on('getRoomList', () => {
    socket.emit('roomList', rooms);
  });
  // Xử lý khi client ngắt kết nối
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    // Xóa client khỏi các phòng chat
    rooms.forEach(room => {
      room.clients = room.clients.filter(client => client !== socket.id);
    });
  });
});

const PORT = 3000;
io.listen(PORT);
console.log(`Server is running on port ${PORT}`);