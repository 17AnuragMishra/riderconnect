import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

let configured = false;

function initWebPush() {
  if (configured) return;

  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn('Web Push not configured. Set WEB_PUSH_PUBLIC_KEY and WEB_PUSH_PRIVATE_KEY in backend .env');
    return;
  }

  webpush.setVapidDetails(
    process.env.WEB_PUSH_CONTACT || 'mailto:support@riderconnect.app',
    publicKey,
    privateKey
  );

  configured = true;
}

export function isPushConfigured() {
  initWebPush();
  return configured;
}

export function getPublicVapidKey() {
  return process.env.WEB_PUSH_PUBLIC_KEY || null;
}

async function sendPushToSubscription(subscriptionDoc, payload) {
  if (!isPushConfigured()) return { success: false, reason: 'not_configured' };

  const message = JSON.stringify(payload);
  const subscription = {
    endpoint: subscriptionDoc.endpoint,
    keys: {
      p256dh: subscriptionDoc.keys?.p256dh,
      auth: subscriptionDoc.keys?.auth,
    },
  };

  try {
    await webpush.sendNotification(subscription, message, {
      TTL: 120,
      urgency: payload.urgency || 'high',
    });
    return { success: true };
  } catch (error) {
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      await PushSubscription.deleteOne({ _id: subscriptionDoc._id });
      return { success: false, reason: 'expired_subscription' };
    }
    console.error('Web push send error:', error?.message || error);
    return { success: false, reason: 'send_failed' };
  }
}

export async function sendPushToUserIds(userIds, payload) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  const subscriptions = await PushSubscription.find({ userId: { $in: uniqueUserIds } });

  let sent = 0;
  let failed = 0;

  for (const subscriptionDoc of subscriptions) {
    const result = await sendPushToSubscription(subscriptionDoc, payload);
    if (result.success) sent += 1;
    else failed += 1;
  }

  return { sent, failed };
}

export async function sendPushToUser(userId, payload) {
  const { sent, failed } = await sendPushToUserIds([userId], payload);
  return { sent, failed };
}
