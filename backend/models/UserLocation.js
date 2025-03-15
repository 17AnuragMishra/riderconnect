import mongoose from 'mongoose';

const UserLocationSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  clerkId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  isOnline: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model('UserLocation', UserLocationSchema);