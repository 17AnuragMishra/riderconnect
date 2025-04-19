import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  groupId: { type: String, required: true },
  senderId: { type: String }, 
  senderName: { type: String }, 
  groupName: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  type: { type: String, enum: ['message', 'invitation', 'update', 'reminder', 'distance'], required: true },
  timestamp: { type: Date, default: Date.now },
});

NotificationSchema.index({ userId: 1, groupId: 1, timestamp: -1 });
export default mongoose.model('Notification', NotificationSchema);