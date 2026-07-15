import { Server } from "socket.io";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  console.log("Socket.IO server initialized");

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-video", (videoId) => {
      socket.join(`video_${videoId}`);
    });

    socket.on("leave-video", (videoId) => {
      socket.leave(`video_${videoId}`);
    });

    socket.on("join-channel", (channelId) => {
      socket.join(`channel_${channelId}`);
    });

    socket.on("leave-channel", (channelId) => {
      socket.leave(`channel_${channelId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

export function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}