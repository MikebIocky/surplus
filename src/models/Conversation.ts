// src/models/Conversation.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IUser } from './User';

export interface IConversation extends Document {
  participants: Array<Types.ObjectId | IUser>; // Array containing two user IDs
  lastMessage?: Types.ObjectId; // Reference to the latest message (optional)
  createdAt: Date;
  updatedAt: Date; // Updated when a new message is added
}

const ConversationSchema: Schema<IConversation> = new Schema(
  {
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    lastMessage: { // Optional reference to the last message sent in this convo
        type: Schema.Types.ObjectId,
        ref: 'Message',
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    // Ensure unique conversations between the same two participants regardless of order
    indexes: [{ unique: true, fields: { participants: 1 } }] // Requires careful handling on creation
  }
);

// Pre-save hook to sort participants array to ensure uniqueness like [userA, userB] is the same as [userB, userA]
ConversationSchema.pre<IConversation>('save', function(next) {
    // Ensure participants array exists and has elements before sorting
    if (this.participants && this.participants.length > 0) {
        // Sort based on the ObjectId strings
        this.participants.sort((a, b) => String(a).localeCompare(String(b)));
    }
    next();
});

const Conversation: Model<IConversation> = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;