import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  source: { type: String, required: true }, // New field
  destination: { type: String, required: true }, // New field
  date: { type: Date, required: false }, // Placeholder for future
  time: { type: String, required: false }, // Placeholder for future (e.g., "14:30")
  members: [{
    clerkId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
  }],
  createdBy: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Group || mongoose.model('Group', GroupSchema);