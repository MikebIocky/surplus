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
  following: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  // --- End added fields ---
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    value: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/.+\@.+\..+/, 'Please fill a valid email address'] },
  password: { type: String, required: true, select: false },
  avatar: { type: String },
  description: { type: String, trim: true },
  rating: { type: Number, default: 0 },
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  ratings: { type: [RatingSchema], default: [] },
  averageRating: { type: Number, default: 0 },
}, { timestamps: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;