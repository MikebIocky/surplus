import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IUser } from './User';
import type { IConversation } from './Conversation';

export interface IMessage extends Document {
  conversation: Types.ObjectId | IConversation;
  sender: Types.ObjectId | IUser;
  receiver: Types.ObjectId | IUser; // Useful for notifications/queries
  content: string;
  read: boolean; // For read receipts (optional)
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversation: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: { // Denormalize receiver for easier querying if needed
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    read: {
        type: Boolean,
        default: false
    }
  },
  { timestamps: true }
);

// Create the model
const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
export { Message }; // Add named export for compatibility