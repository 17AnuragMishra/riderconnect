import mongoose from 'mongoose';

const UserLocationSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  clerkId: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number },
  isOnline: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model('UserLocation', UserLocationSchema);