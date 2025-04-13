import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Group from './models/Group.js';
import Message from './models/Message.js';
import UserLocation from './models/UserLocation.js';
import { getDistance } from 'geolib';

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(cors({
  origin: ["https://your-vercel-app.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

// And for Socket.io:
const io = new Server(server, { 
  cors: {
    origin: ["https://your-vercel-app.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  }, 
});
app.use(express.json());

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};
connectDB();

const users = {};
const groupSockets = {};
const viewingState = {};
app.post('/groups/create', async (req, res) => {
    const { name, source, destination, clerkId, clerkName, clerkAvatar } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
        const group = new Group({
            name,
            source,
            destination,
            code,
            createdBy: clerkId,
            members: [{ clerkId, name: clerkName, avatar: clerkAvatar }]
        });
        await group.save();
        console.log("Created group in DB:", group); // Debug log
        res.json(group);
    } catch (err) {
        console.error('Create group error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/groups/join', async (req, res) => {
    const { code, clerkId, clerkName, clerkAvatar } = req.body;
    try {
        const group = await Group.findOne({ code });
        if (!group) return res.status(404).json({ error: 'Group not found' });
        if (group.members.some((m) => m.clerkId === clerkId)) {
            return res.status(400).json({ error: 'Already in group' });
        }
        group.members.push({ clerkId, name: clerkName, avatar: clerkAvatar });
        await group.save();
        res.json({ id: group._id, name: group.name, code, source: group.source, destination: group.destination, members: group.members });
    } catch (err) {
        console.error('Join group error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/groups', async (req, res) => {
    const { clerkId } = req.query;
    try {
        const groups = await Group.find({ "members.clerkId": clerkId });
        console.log("Groups for clerkId", clerkId, ":", groups);
        res.json(groups);
    } catch (err) {
        console.error('Get groups error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/groups/:id', async (req, res) => {
    const { id } = req.params;
    const { clerkId } = req.query;
    try {
      const group = await Group.findOne({ _id: id });
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (!group.members.some(m => m.clerkId === clerkId)) {
        return res.status(403).json({ error: 'Not authorized to delete this group' });
      }
      await Group.deleteOne({ _id: id });
      await Message.deleteMany({ groupId: id });
      await UserLocation.deleteMany({ groupId: id });
      res.json({ success: true });
    } catch (err) {
      console.error('Delete group error:', err);
      res.status(500).json({ error: err.message });
    }
  });

app.get('/messages/group/:groupId', async (req, res) => {
    console.log('Fetching messages for groupId:', req.params.groupId);
    try {
        const messages = await Message.find({ groupId: req.params.groupId }).sort({ timestamp: 1 });
        res.json({ data: messages });
    } catch (err) {
        console.error('Fetch messages error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join', async ({ clerkId, groupId }) => {
      users[socket.id] = clerkId;
      socket.join(groupId);
      if (!groupSockets[groupId]) groupSockets[groupId] = [];
      groupSockets[groupId].push(socket.id);
      console.log(`Socket ${socket.id} joined room ${groupId}, current sockets:`, groupSockets[groupId]);
      try {
        const group = await Group.findOneAndUpdate(
          { _id: groupId, 'members.clerkId': clerkId },
          { $set: { 'members.$.isOnline': true } },
          { new: true }
        );
        if (group && Array.isArray(group.members)) {
          console.log(`Emitting memberStatusUpdate to ${groupId}:`, group.members);
          io.to(groupId).emit('memberStatusUpdate', group.members);
          io.emit('groupUpdate', group);
        } else {
          console.error(`Invalid group or members for ${groupId}:`, group);
          socket.emit('error', { message: 'Invalid group data' });
        }
          const location = await UserLocation.findOneAndUpdate(
            { groupId, clerkId },
            { groupId, clerkId, isOnline: true, lastUpdated: new Date() },
            { upsert: true, new: true }
          );
          io.to(groupId).emit('locationUpdate', location);
          const groupLocations = await UserLocation.find({ groupId });
          socket.emit('groupLocations', groupLocations);
          if (group) io.emit('groupUpdate', group);
        } catch (err) {
          console.error('Error in join:', err);
          socket.emit('error', { message: 'Failed to join group', error: err.message });
        }
      });
  
      socket.on('sendMessage', async ({ groupId, clerkId, clerkName, content }) => {
        try {
          const message = new Message({ groupId, senderId: clerkId, senderName: clerkName, content });
          await message.save();
          io.to(groupId).emit('receiveMessage', message);
      
          const group = await Group.findById(groupId);
          if (!group) {
            console.error(`Group ${groupId} not found`);
            return;
          }
      
          console.log(`Processing notifications for group ${groupId}, sender: ${clerkId}`);
          group.members.forEach((member) => {
            if (member.clerkId === clerkId) return;
            console.log(`Member ${member.clerkId}: isOnline=${member.isOnline}, viewing=${viewingState[member.clerkId]}`);
            if (!member.isOnline) {
              console.log(`Queue offline notification for ${member.clerkId}: New message in ${group.name} - "${content}"`);
            } else if (viewingState[member.clerkId] !== groupId) {
              console.log(`Sending notification to ${member.clerkId} (online, not viewing ${groupId})`);
              io.to(groupId).emit('newMessageNotification', { message, for: member.clerkId });
            } else {
              console.log(`No notification for ${member.clerkId} (viewing ${groupId})`);
            }
          });
        } catch (err) {
          console.error('Send message error:', err);
          socket.emit('error', { message: 'Failed to send message', error: err.message });
        }
      });
  
      socket.on('viewingGroup', ({ groupId, clerkId }) => {
        viewingState[clerkId] = groupId;
        console.log(`User ${clerkId} viewing group: ${groupId || 'none'}`);
        console.log('Current viewingState:', viewingState); // Debug
      });
    
    const distanceAlertCooldown = new Map();

    socket.on('updateLocation', async ({ groupId, clerkId, lat, lng }) => {
  try {
    const location = await UserLocation.findOneAndUpdate(
      { groupId, clerkId },
      { lat, lng, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    io.to(groupId).emit('locationUpdate', location);

    const groupLocations = await UserLocation.find({ groupId });
    groupLocations.forEach((otherLoc) => {
      if (otherLoc.clerkId !== clerkId && otherLoc.lat && otherLoc.lng) {
        const distance = getDistance(
          { latitude: lat, longitude: lng },
          { latitude: otherLoc.lat, longitude: otherLoc.lng }
        );
        const alertKey = `${clerkId}-${otherLoc.clerkId}`;
        const lastAlert = distanceAlertCooldown.get(alertKey) || 0;
        const now = Date.now();
        if (distance > 1000 && (now - lastAlert) > 60000) { 
          io.to(groupId).emit('distanceAlert', {
            clerkId,
            otherClerkId: otherLoc.clerkId,
            distance,
          });
          distanceAlertCooldown.set(alertKey, now);
        }
      }
    });

    socket.on('send-location', async (data) => {
        io.emit('recieve-location', { id: socket.id, ...data });
    })

    socket.on('disconnect', async () => {
      const clerkId = users[socket.id];
    if (!clerkId) return;
    console.log('User disconnected:', socket.id, 'clerkId:', clerkId);
    delete users[socket.id];
    for (const groupId in groupSockets) {
      groupSockets[groupId] = groupSockets[groupId].filter(id => id !== socket.id);
      console.log(`Socket ${socket.id} left room ${groupId}, remaining sockets:`, groupSockets[groupId]);
      if (groupSockets[groupId].length === 0) delete groupSockets[groupId];
      try {
        const group = await Group.findOneAndUpdate(
          { _id: groupId, 'members.clerkId': clerkId },
          { $set: { 'members.$.isOnline': false } },
          { new: true }
        );
        if (group && Array.isArray(group.members)) {
          console.log(`Emitting memberStatusUpdate to ${groupId}:`, group.members);
          io.to(groupId).emit('memberStatusUpdate', group.members);
          io.emit('groupUpdate', group);
        }
      } catch (err) {
        console.error('Disconnect error:', err);
      }
    }
  });
  }catch(error){
    console.log(error);
  }
});
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));