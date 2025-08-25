const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("../models/MessageModel");
const dotenv = require('dotenv');

dotenv.config();

function initializeSocket(server) {
    const io = new Server(server, { cors: { origin: "*" } });

    let onlineUsers = new Map(); // Lưu danh sách user online (userId -> socketId)

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Unauthorized"));
        }
        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                return next(new Error("Unauthorized"));
            }
            socket.user = decoded; // Gán thông tin user đã decode cho socket
            next();
        });
    });



    io.on("connection", (socket) => {

        onlineUsers.set(socket.user._id, socket.id); // Cập nhật danh sách user online
        socket.emit("updateUsers", Array.from(onlineUsers.keys()))

        // 🎯 Tham gia phòng chat (dành cho nhóm)
        socket.on("joinRoom", async ({ roomId }) => {
            console.log(roomId)
            socket.join(roomId);
            console.log(`User ${socket.user._id} joined room: ${roomId}`);
        });

        // 🎯 Gửi tin nhắn (chat riêng hoặc chat nhóm)
        socket.on("sendMessage", async ({ text, roomId, receiverId }) => {
            if (roomId) {
                console.log("📢 Nhóm: Gửi tin nhắn vào phòng", roomId);
                const newMessage = new Message({ sender: socket.user._id, text, chatRoom: roomId });
                await newMessage.save();
                // Dùng await để population
                const data = await newMessage.populate("sender", "username");
                io.to(roomId).emit("receiveMessage", data);
                console.log("📢 Gửi tin nhắn thành công");
            } else if (receiverId) {
                console.log("📩 Gửi tin nhắn riêng");
                let newMessage = new Message({ sender: socket.user._id, receiver: receiverId, text });
                await newMessage.save();
                newMessage = await newMessage.populate("sender", "username");
                // Gửi tin nhắn cho người gửi
                socket.emit("receiveMessage", newMessage);
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receiveMessage", newMessage);
                    console.log("✅ Đã gửi tin nhắn riêng thành công!");
                } else {
                    console.log("❌ Người nhận offline, chỉ lưu tin nhắn vào database.");
                }
            }
        });





        // 🎯 Khi user rời đi
        socket.on("disconnect", () => {
            onlineUsers.forEach((value, key) => {
                if (value === socket.id) {
                    onlineUsers.delete(key);
                }
            });
        });
    });
}

module.exports = initializeSocket;
