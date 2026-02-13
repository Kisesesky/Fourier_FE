// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let chatSocket: Socket | null = null;
let chatSocketToken: string | null = null;

export function getSocket() {
  if (typeof window === "undefined") return null;
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
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
  const url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
  const resolvedToken =
    token ??
    (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

  if (!chatSocket || chatSocketToken !== resolvedToken) {
    if (chatSocket) {
      chatSocket.disconnect();
      chatSocket = null;
    }
    chatSocketToken = resolvedToken ?? null;
    chatSocket = io(`${url}/chat`, {
      transports: ["websocket"],
      withCredentials: true,
      auth: chatSocketToken ? { token: chatSocketToken } : undefined,
    });
    return chatSocket;
  }

  if (!chatSocket.connected) {
    chatSocket.auth = chatSocketToken ? { token: chatSocketToken } : {};
    chatSocket.connect();
  }

  return chatSocket;
}

export function closeChatSocket() {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
  chatSocketToken = null;
}
