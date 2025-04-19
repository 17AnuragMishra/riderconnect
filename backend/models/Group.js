import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  startTime: { type: String, required: true },
  reachTime: { type: String, required: true },
  members: [{
    clerkId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
  }],
  createdBy: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Group || mongoose.model('Group', GroupSchema);