import mongoose from 'mongoose';
import Message from '../src/models/Message';
import Conversation from '../src/models/Conversation';

async function migrateMessages() {
  await mongoose.connect(process.env.MONGODB_URI!);

  // Find all unique user pairs
  const pairs = await Message.aggregate([
    {
      $group: {
        _id: {
          users: {
            $setUnion: [
              ['$sender'],
              ['$recipient'] // or '$receiver' if that's your field
            ]
          }
        }
      }
    }
  ]);

  for (const pair of pairs) {
    const [userA, userB] = pair._id.users;
    // Sort to ensure uniqueness
    const participants = [userA, userB].sort();
    let conversation = await Conversation.findOne({ participants });
    if (!conversation) {
      conversation = await Conversation.create({ participants });
    }
    // Update all messages between these users
    await Message.updateMany(
      {
        $or: [
          { sender: userA, recipient: userB },
          { sender: userB, recipient: userA }
        ]
      },
      { $set: { conversation: conversation._id } }
    );
  }

  console.log('Migration complete!');
  await mongoose.disconnect();
}

migrateMessages(); 