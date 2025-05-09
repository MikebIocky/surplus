// src/models/Order.ts (Alternative/Recommended for Received items)
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IOrder extends Document {
  listing: Types.ObjectId | { _id: Types.ObjectId; title: string; description: string; image?: string; user: { _id: Types.ObjectId; name: string; avatar?: string } }; // Nested population
  recipient: Types.ObjectId | { _id: Types.ObjectId; name: string };
  claimedAt: Date;
  // Add other order details if needed (e.g., messages, confirmation status)
}

const OrderSchema: Schema<IOrder> = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // The user who received
    claimedAt: { type: Date, default: Date.now },
  }
  // No timestamps needed unless you want order creation/update time separate from claim time
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;