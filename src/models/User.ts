// src/models/User.ts (Ensure it looks similar to this)
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId; // Explicitly add _id if not extending Document properly
  name: string;
  email: string;
  password?: string; // Excluded by default via select: false
  // --- Add these fields (make optional with '?') ---
  avatar?: string;
  description?: string;
  rating?: number;
  // --- End added fields ---
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/.+\@.+\..+/, 'Please fill a valid email address'] },
    password: { type: String, required: true, select: false },
    avatar: { type: String }, // Optional in schema
    description: { type: String, trim: true }, // Optional in schema
    rating: { type: Number, default: 0 }, // Example default
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;