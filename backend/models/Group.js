import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  source: { type: String, required: true },
  sourceCoords: {
    lat: { type: Number },
    lng: { type: Number },
  },
  destination: { type: String, required: true },
  destinationCoords: {
    lat: { type: Number },
    lng: { type: Number },
  },
  startTime: { type: Date, required: true },
  reachTime: { type: Date, required: true },
  members: [{
    clerkId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
  }],
  createdBy: { type: String, required: true },
  distanceThreshold: {type: Number, default: 1000}
}, { timestamps: true });

export default mongoose.models.Group || mongoose.model('Group', GroupSchema);
