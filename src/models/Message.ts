import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IUser } from './User';
import type { IConversation } from './Conversation';

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  content: string;
  createdAt: Date;
  read: boolean;
}

const MessageSchema = new Schema<IMessage>({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Create the model
const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
export { Message }; // Add named export for compatibility