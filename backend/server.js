import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Group from './models/Group.js';
import Message from './models/Message.js';
import UserLocation from './models/UserLocation.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected to Atlas');
  } catch (err) {
    console.error('MongoDB error:', err);
    process.exit(1);
  }
};
connectDB();

// Rest of the code remains unchanged...
const generateUniqueCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

app.post('/groups/create', async (req, res) => {
  const { name, source, destination, clerkId, clerkName, clerkAvatar } = req.body;
  let code;
  let attempts = 0;
  do {
    code = generateUniqueCode();
    attempts++;
    if (attempts > 10) return res.status(500).json({ error: 'Failed to generate unique code' });
  } while (await Group.findOne({ code }));

  try {
    const group = new Group({
      name,
      code,
      source,
      destination,
      members: [{ clerkId, name: clerkName, avatar: clerkAvatar }],
    });
    await group.save();
    res.status(201).json({ id: group._id, name, code, source, destination, members: group.members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/groups/join', async (req, res) => {
  const { code, clerkId, clerkName, clerkAvatar } = req.body;
  try {
    const group = await Group.findOne({ code });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.members.some((m) => m.clerkId === clerkId)) return res.status(400).json({ error: 'Already in group' });
    group.members.push({ clerkId, name: clerkName, avatar: clerkAvatar });
    await group.save();
    res.json({ id: group._id, name: group.name, code, source: group.source, destination: group.destination, members: group.members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/groups', async (req, res) => {
  const { clerkId } = req.query;
  try {
    const groups = await Group.find({ 'members.clerkId': clerkId });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/messages/group/:groupId', async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId }).sort({ timestamp: 1 });
    res.json({ data: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/location/update', async (req, res) => {
  const { groupId, clerkId, latitude, longitude } = req.body;
  try {
    const location = await UserLocation.findOneAndUpdate(
      { groupId, clerkId },
      { latitude, longitude, isOnline: true, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    io.to(groupId).emit('locationUpdate', location);
    res.json(location);

    const groupLocations = await UserLocation.find({ groupId });
    groupLocations.forEach((loc) => {
      if (loc.clerkId !== clerkId) {
        const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
        if (distance > 2000) {
          io.to(groupId).emit('notification', {
            type: 'distance',
            memberId: loc.clerkId,
            message: `${loc.clerkId} is more than 2km away`,
            timestamp: new Date(),
          });
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const users = {};
const groupSockets = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ clerkId, groupId }) => {
    users[socket.id] = clerkId;
    socket.join(groupId);
    if (!groupSockets[groupId]) groupSockets[groupId] = [];
    groupSockets[groupId].push(socket.id);
    console.log(`User ${clerkId} joined group ${groupId}`);
  });

  socket.on('sendMessage', async ({ groupId, clerkId, clerkName, content }) => {
    try {
      const message = new Message({ groupId, senderId: clerkId, senderName: clerkName, content });
      await message.save();
      io.to(groupId).emit('receiveMessage', message);
      console.log('Message sent to group:', groupId);
    } catch (err) {
      console.error('Send message error:', err);
    }
  });

  socket.on('disconnect', async () => {
    const clerkId = users[socket.id];
    console.log('User disconnected:', socket.id);
    delete users[socket.id];
    for (const groupId in groupSockets) {
      groupSockets[groupId] = groupSockets[groupId].filter((id) => id !== socket.id);
      const location = await UserLocation.findOneAndUpdate(
        { groupId, clerkId },
        { isOnline: false },
        { new: true }
      );
      if (location) {
        io.to(groupId).emit('locationUpdate', location);
        io.to(groupId).emit('notification', {
          type: 'offline',
          memberId: clerkId,
          message: `${clerkId} lost connection. Last known location shared.`,
          timestamp: new Date(),
        });
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));