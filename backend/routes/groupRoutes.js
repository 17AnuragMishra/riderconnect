import express from 'express';
import Group from '../models/Group.js';
import Message from '../models/Message.js';
import UserLocation from '../models/UserLocation.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.post('/create', async (req, res) => {
  const { name, source, destination, startTime, reachTime, clerkId, clerkName } = req.body;
  try {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const group = new Group({
      name,
      code,
      source,
      destination,
      startTime: new Date(startTime).toISOString(),
      reachTime: new Date(reachTime).toISOString(),
      members: [{ clerkId, name: clerkName }],
      createdBy: clerkId,
    });

    await group.save();
    const io = req.app.get('io');
    io.emit('groupUpdate', group);
    res.json(group);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.post('/join', async (req, res) => {
  const { code, clerkId, clerkName, clerkAvatar } = req.body;
  try {
    const group = await Group.findOne({ code });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.members.some((m) => m.clerkId === clerkId)) {
      return res.status(400).json({ error: 'Already in group' });
    }
    group.members.push({ clerkId, name: clerkName, avatar: clerkAvatar });
    await group.save();
    const notifications = group.members
      .filter((m) => m.clerkId !== clerkId)
      .map((m) => ({
        userId: m.clerkId,
        groupId: group._id.toString(),
        senderId: clerkId,
        senderName: clerkName,
        groupName: group.name,
        message: `${clerkName} has joined the group`,
        type: 'invitation',
        priority: 'medium',
      }));
    await Notification.insertMany(notifications);
    req.app.get('io').to(group._id.toString()).emit('groupUpdate', group);
    res.json({ id: group._id, name: group.name, code, source: group.source, destination: group.destination, members: group.members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/active', async (req, res) => {
  try {
    const clerkId = req.query.clerkId;
    if (!clerkId) {
      return res.status(400).json({ error: 'clerkId missing' });
    }
    const now = new Date();
    const groups = await Group.find({'members.clerkId': clerkId, reachTime: {$gte: now}});
    res.json({ data: groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/archive', async (req, res) => {
  try {
    const clerkId = req.query.clerkId;
    if (!clerkId) {
      return res.status(400).json({ error: 'clerkId missing' });
    }
    const now = new Date();
    const groups = await Group.find({'members.clerkId': clerkId, reachTime: {$lt: now}});
    res.json({ data: groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.patch('/distanceThreshold', async (req, res) => {
  const { groupId, distanceThreshold, clerkId } = req.body;
  try {
    if (!groupId || !distanceThreshold || !clerkId) {
      return res.status(400).json({ error: 'groupId, distanceThreshold, and clerkId are required' });
    }
    if (typeof distanceThreshold !== 'number' || distanceThreshold < 100 || distanceThreshold > 2000) {
      return res.status(400).json({ error: 'distanceThreshold must be a number between 100 and 2000' });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (!group.members.some((m) => m.clerkId === clerkId)) {
      return res.status(403).json({ error: 'Not authorized to update this group' });
    }
    group.distanceThreshold = distanceThreshold;
    await group.save();
    const io = req.app.get('io');
    io.to(groupId).emit('groupUpdate', group);
    res.json({ data: group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/', async (req, res) => {
  const { clerkId } = req.query;
  if (!clerkId) return res.status(400).json({ error: 'clerkId is required' });
  try {
    const groups = await Group.find({ 'members.clerkId': clerkId });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const clerkId = req.query.clerkId;
    if (!clerkId) {
      return res.status(400).json({ error: 'clerkId missing' });
    }
    const now = new Date();
    const groups = await Group.find({'members.clerkId':clerkId,reachTime:{$gte:now}});
    res.json({data:groups});
  } catch (err) {
    res.status(500).json({ error: err.message});
  }
});
router.get('/archive', async (req, res) => {
  try {
    const clerkId = req.query.clerkId;
    if (!clerkId) {
      return res.status(400).json({ error: 'clerkId missing' });
    }
    const now = new Date();
    const groups = await Group.find({'members.clerkId': clerkId,reachTime:{$lt:now}});
    res.json({ data:groups});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
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
    await Notification.deleteMany({ groupId: id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/messages/group/:groupId', async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId }).sort({ timestamp: 1 });
    res.json({ data: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;