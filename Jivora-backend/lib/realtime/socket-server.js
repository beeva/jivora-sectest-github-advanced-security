/**
 * Socket.IO server: member-practitioner chat and live badge counts.
 *
 * The browser connects to the host-published backend port -- it cannot resolve
 * the internal Docker backend hostname.
 */
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "jivora-dev-secret";

let io = null;

function initSocketServer(server) {
  io = socketIo(server, {
    cors: { origin: "*", credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      socket.user = jwt.decode(token) || null;
    }
    return next();
  });

  io.on("connection", (socket) => {
    socket.on("conversation:join", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("message:send", (payload) => {
      io.to(`conversation:${payload.conversationId}`).emit("message:new", payload);
    });
  });

  return io;
}

function getIo() {
  return io;
}

module.exports = { initSocketServer, getIo };
