import mongoose from 'mongoose';

const RouteCacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.RouteCache || mongoose.model('RouteCache', RouteCacheSchema);

