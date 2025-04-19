import mongoose from 'mongoose';

const UserLocationSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  clerkId: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number },
  lastUpdated: { type: Date, default: Date.now },
});

UserLocationSchema.index({ groupId: 1, clerkId: 1 });
export default mongoose.model('UserLocation', UserLocationSchema);