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
const io = new Server(server, { cors: { origin: 'http://localhost:3000' } });

app.use(cors());
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
    socket.on('join', async ({ clerkId, groupId }) => {
        users[socket.id] = clerkId;
        socket.join(groupId);
        if (!groupSockets[groupId]) groupSockets[groupId] = [];
        groupSockets[groupId].push(socket.id);
        console.log(`User ${clerkId} joined group ${groupId}`);

        try {
            const location = await UserLocation.findOneAndUpdate(
                { groupId, clerkId },
                { groupId, clerkId, isOnline: true, lastUpdated: new Date() },
                { upsert: true, new: true }
            );
            io.to(groupId).emit('locationUpdate', location); // Broadcast status 
        } catch (err) {
            console.error(`Error updating UserLocation on join:`, err.message);
        }
    });

    socket.on('sendMessage', async ({ groupId, clerkId, clerkName, content }) => {
        console.log('sendMessage:', { groupId, clerkId, content });
        try {
            const message = new Message({ groupId, senderId: clerkId, senderName: clerkName, content });
            await message.save();
            io.to(groupId).emit('receiveMessage', message);
        } catch (err) {
            console.error('Send message error:', err);
            socket.emit('error', { message: 'Failed to send message', error: err.message });
        }
    });

    socket.on('disconnect', async () => {
        const clerkId = users[socket.id];
        console.log('User disconnected:', socket.id, 'clerkId:', clerkId);
        if (!clerkId) return;
        delete users[socket.id];
        for (const groupId in groupSockets) {
            groupSockets[groupId] = groupSockets[groupId].filter((id) => id !== socket.id);
            try {
                const location = await UserLocation.findOneAndUpdate(
                    { groupId, clerkId },
                    { isOnline: false },
                    { new: true }
                );
                if (location) {
                    console.log(`Updated location for ${clerkId} in group ${groupId}:`, location);
                    io.to(groupId).emit('locationUpdate', location);
                    io.to(groupId).emit('notification', {
                        type: 'offline',
                        memberId: clerkId,
                        message: `${clerkId} lost connection. Last known location shared.`,
                        timestamp: new Date(),
                    });
                } else {
                    console.log(`No UserLocation found for ${clerkId} in group ${groupId}`);
                }
            } catch (err) {
                console.error(`Error updating UserLocation for ${clerkId} in group ${groupId}:`, err);
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));