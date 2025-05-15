// src/models/Conversation.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './User';

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
}

const ConversationSchema = new Schema<IConversation>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' }
});

// Pre-save hook to sort participants array to ensure uniqueness like [userA, userB] is the same as [userB, userA]
ConversationSchema.pre<IConversation>('save', function(next) {
    // Ensure participants array exists and has elements before sorting
    if (this.participants && this.participants.length > 0) {
        // Sort based on the ObjectId strings
        this.participants.sort((a, b) => String(a).localeCompare(String(b)));
    }
    next();
});

const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;