import mongoose from 'mongoose';

const PushSubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, default: '' },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export default mongoose.model('PushSubscription', PushSubscriptionSchema);
