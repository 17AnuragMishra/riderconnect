import express from 'express';
import Notification from '../models/Notification.js';
import PushSubscription from '../models/PushSubscription.js';
import { getPublicVapidKey, isPushConfigured, sendPushToUser } from '../utils/webPush.js';

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

router.get('/push/vapid-public-key', async (_req, res) => {
  const publicKey = getPublicVapidKey();

  if (!publicKey || !isPushConfigured()) {
    return res.status(503).json({
      error: 'Web push is not configured on server',
    });
  }

  return res.json({ publicKey });
});

router.post('/push/subscribe', async (req, res) => {
  const { clerkId, subscription } = req.body;

  if (!clerkId) {
    return res.status(400).json({ error: 'clerkId is required' });
  }

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({
      error: 'Valid subscription with endpoint, keys.p256dh and keys.auth is required',
    });
  }

  try {
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: clerkId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        userAgent: req.headers['user-agent'] || '',
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/push/unsubscribe', async (req, res) => {
  const { clerkId, endpoint } = req.body;

  if (!clerkId || !endpoint) {
    return res.status(400).json({ error: 'clerkId and endpoint are required' });
  }

  try {
    await PushSubscription.deleteOne({ userId: clerkId, endpoint });
    return res.json({ success: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/push/test', async (req, res) => {
  const { clerkId } = req.body;

  if (!clerkId) {
    return res.status(400).json({ error: 'clerkId is required' });
  }

  try {
    const payload = {
      title: 'RiderConnect Test Notification',
      body: 'Web push is active on this device. You will get ride updates here.',
      icon: '/placeholder-logo.png',
      badge: '/placeholder-logo.png',
      tag: 'riderconnect-test',
      url: '/dashboard',
      timestamp: Date.now(),
    };

    const result = await sendPushToUser(clerkId, payload);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Test push error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;