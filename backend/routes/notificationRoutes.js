import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { clerkId } = req.query;
  try {
    const notifications = await Notification.find({ userId: clerkId })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(notifications.map(n => ({
      id: n._id.toString(),
      senderId: n.senderId,
      groupId: n.groupId,
      senderName: n.senderName,
      groupName: n.groupName,
      message: n.message,
      isRead: n.isRead,
      priority: n.priority,
      type: n.type,
      time: n.timestamp,
    })));
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/mark-all', async (req, res) => {
  const { clerkId } = req.body;
  try {
    await Notification.updateMany({ userId: clerkId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;