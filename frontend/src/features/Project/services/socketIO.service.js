import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    const url = "http://localhost:3000";
    socket = io(url, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};