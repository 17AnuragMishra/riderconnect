import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  members: [{ clerkId: String, name: String, avatar: String }],
  source: { type: String },
  destination: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Group', GroupSchema);