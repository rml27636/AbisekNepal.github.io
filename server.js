const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // For Socket.IO integration
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path'); // Import the path module to handle paths
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

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
const Rental = require('./models/rental')

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Attach Socket.IO to HTTP server

// Middleware
app.use(cookieParser());
app.use(express.json()); // Parse JSON requests
// Middleware for CORS
app.use(cors({
  origin: 'http://localhost:3000',  // Replace with your frontend URL
  credentials: true,               // This ensures cookies are sent with requests
}));
// Middleware to parse incoming JSON request bodies
//app.use(express.json());


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

  // Handle chat messages
  socket.on('chatMessage', (data) => {
    const { message, roomId, senderId } = data;

    // You might want to fetch the sender's name from your DB using senderId
    const senderName = 'Renter'; // Example: replace with real sender info

    // Broadcast the message to everyone in the room
    io.to(roomId).emit('chatMessage', { senderName, message });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
app.get('/api/profile', async (req, res) => {
  const userId = req.cookies.userId; // Assuming userId is stored in cookies
  console.log('UserID from cookies:', userId);  // Log the userId to debug

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
// Fetch Items API
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find({});
    res.json(items.map(item => ({
      id: item._id,
      name: item.name,
      age: item.age,
      owner: item.owner,
      location: item.location,
      description: item.description,
      price: item.price,
      imageUrl: item.image,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching items');
  }
});
app.get('/api/rental', async (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
      return res.status(401).json({ message: 'User not logged in' });
  }

  try {
      const rentalRequests = await Rental.find({ ownerId: userId }).populate('itemId');
      const formattedRequests = rentalRequests.map(request => ({
          id: request._id,
          itemName: request.itemId.name,
          itemPrice: request.itemId.price,
          rentalPeriod: request.rentalPeriod,
          location: request.itemId.location,
          date: request.createdAt,
          status: request.status,
      }));

      res.json({ requests: formattedRequests });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching rental requests');
  }
});
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Extract token from header

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = user;  // Attach the user to the request object
    next();  // Proceed to the next middleware or route handler
  });
};
// Routes
app.use('/api/user', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/rental', rentalRoutes,authenticateJWT);
app.use('/api/payment', paymentRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/chat', chatRoutes, authenticateJWT);


// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
