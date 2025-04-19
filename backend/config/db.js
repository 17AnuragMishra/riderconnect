import mongoose from 'mongoose';
import Group from '../models/Group.js';
import UserLocation from '../models/UserLocation.js';
import Notification from '../models/Notification.js';
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    await Group.createIndexes();
    await UserLocation.createIndexes();
    await Notification.createIndexes();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
export default connectDB;