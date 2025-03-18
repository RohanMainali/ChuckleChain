const socketIo = require("socket.io")
const jwt = require("jsonwebtoken")
const User = require("./models/User")

// Map to store active user connections
const activeUsers = new Map()

const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split("token=")[1]?.split(";")[0]

      if (!token) {
        return next(new Error("Authentication error"))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)

      if (!user) {
        return next(new Error("User not found"))
      }

      socket.user = user
      next()
    } catch (error) {
      next(new Error("Authentication error"))
    }
  })

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username}`)

    // Add user to active users map
    activeUsers.set(socket.user._id.toString(), socket.id)

    // Handle messagesRead event
    socket.on("messagesRead", () => {
      // Emit an event to update the unread count in the navbar
      socket.emit("updateUnreadCount")
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`)
      activeUsers.delete(socket.user._id.toString())
    })
  })

  return io
}

// Function to emit a new message to a user
const emitNewMessage = (io, userId, message) => {
  const socketId = activeUsers.get(userId.toString())
  if (socketId) {
    io.to(socketId).emit("newMessage", message)
  }
}

// Function to emit a new notification to a user
const emitNewNotification = (io, userId, notification) => {
  console.log(`Attempting to emit notification to user ${userId}`, notification)

  // Make sure userId is a string
  const userIdStr = userId.toString()

  const socketId = activeUsers.get(userIdStr)
  if (socketId) {
    console.log(`Socket found for user ${userIdStr}, emitting notification`)
    try {
      io.to(socketId).emit("newNotification", notification)
      console.log("Notification emitted successfully")
    } catch (error) {
      console.error("Error emitting notification:", error)
    }
  } else {
    console.log(`No active socket found for user ${userIdStr}`)
    // Store notification for delivery when user connects
    // This would require additional code to store pending notifications
  }
}

module.exports = {
  initializeSocket,
  emitNewMessage,
  emitNewNotification,
}

