import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'location'], default: 'text' },
  locationData: {
    lat: { type: Number },
    lng: { type: Number },
    riderName: { type: String },
    reason: { type: String },
  },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);