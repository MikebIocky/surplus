// src/lib/dbConnect.ts
import mongoose from 'mongoose';
// Import models to ensure they are registered
import '@/lib/models';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

async function dbConnect() {
  if (cached.conn) {
    // console.log("Using cached DB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable buffering if not connected
    };

    // console.log("Creating new DB connection");
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      // console.log("DB Connected");
      return mongoose;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on error
    console.error("DB Connection Error:", e);
    throw e; // Re-throw error
  }
  return cached.conn;
}

export default dbConnect;