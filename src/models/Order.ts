// src/models/Order.ts (Alternative/Recommended for Received items)
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrder extends Document {
  listing: Types.ObjectId;
  recipient: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  claimedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  claimedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);