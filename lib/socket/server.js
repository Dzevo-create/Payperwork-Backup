// ============================================
// Socket.IO Server for Real-time Updates (CommonJS)
// ============================================

const { Server } = require("socket.io");

let io = null;

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - HTTP server instance
 */
function initializeSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("[Socket.IO] Client connected:", socket.id);

    // Join user-specific room
    socket.on("join:user", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] User ${userId} joined room`);
      }
    });

    // Leave user-specific room
    socket.on("leave:user", (userId) => {
      if (userId) {
        socket.leave(`user:${userId}`);
        console.log(`[Socket.IO] User ${userId} left room`);
      }
    });

    socket.on("disconnect", () => {
      console.log("[Socket.IO] Client disconnected:", socket.id);
    });
  });

  console.log("[Socket.IO] Server initialized");
  return io;
}

/**
 * Get Socket.IO server instance
 * @returns {Server|null} Socket.IO server instance
 */
function getSocketServer() {
  return io;
}

/**
 * Emit event to specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    console.log(`[Socket.IO] Emitted ${event} to user ${userId}`);
  }
}

/**
 * Emit event to all clients
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
    console.log(`[Socket.IO] Emitted ${event} to all clients`);
  }
}

module.exports = {
  initializeSocketServer,
  getSocketServer,
  emitToUser,
  emitToAll,
};
