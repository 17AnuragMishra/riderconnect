import mongoose from 'mongoose';

const GeoCacheSchema = new mongoose.Schema(
  {
    query: { type: String, required: true, unique: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.GeoCache || mongoose.model('GeoCache', GeoCacheSchema);

