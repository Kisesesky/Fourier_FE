// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let chatSocket: Socket | null = null;

export function getSocket() {
  if (typeof window === "undefined") return null;
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4001";
    socket = io(url, {
      transports: ["websocket"],
      withCredentials: true
    });
  }
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getChatSocket(token?: string | null) {
  if (typeof window === "undefined") return null;
  if (!chatSocket) {
    const url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4001";
    chatSocket = io(`${url}/chat`, {
      transports: ["websocket"],
      withCredentials: true,
      auth: token ? { token } : undefined,
    });
  }
  return chatSocket;
}

export function closeChatSocket() {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
}
