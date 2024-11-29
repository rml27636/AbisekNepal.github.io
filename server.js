const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http'); // For Socket.IO integration
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path'); // Import the path module to handle paths
const cookieParser = require('cookie-parser');

// Load environment variables from a .env file
dotenv.config();

// Import routes
const userRoutes = require('./routes/User');
const itemRoutes = require('./routes/items');
const rentalRoutes = require('./routes/rental');
const paymentRoutes = require('./routes/payment');
const reviewRoutes = require('./routes/review');
const chatRoutes = require('./routes/chat');

const Chat = require('./models/chat');
const User = require('./models/User'); // Adjust the path based on your project structure
const Item = require('./models/items');  // Adjust the path based on your project structure


const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Attach Socket.IO to HTTP server

// Middleware
app.use(cookieParser());
app.use(bodyParser.json()); // Parse JSON requests
// Middleware for CORS
app.use(cors({
  origin: 'http://localhost:3000',  // Replace with your frontend URL
  credentials: true,               // This ensures cookies are sent with requests
}));
// Middleware to parse incoming JSON request bodies
app.use(express.json());


// Serve static files from the 'html' directory
app.use(express.static(path.join(__dirname, 'html')));

// Connect to MongohoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lendit', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Socket.IO Events for Real-Time Chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle chat events
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('sendMessage', async ({ roomId, senderId, message }) => {
    try {
      const chatMessage = new Chat({ roomId, senderId, message });
      await chatMessage.save();

      io.to(roomId).emit('receiveMessage', { senderId, message });
      console.log(`Message sent to room ${roomId}: ${message}`);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
app.get('/api/profile', async (req, res) => {
  const userId = req.cookies.userId; // Assuming userId is stored in cookies

  if (!userId) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  try {
    // Get the user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get items created by the user
    const items = await Item.find({ ownerId: userId });

    // Send response with both user and item data
    res.json({ user, items });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Routes
app.use('/api/user', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/rental', rentalRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/chat', chatRoutes);


// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
