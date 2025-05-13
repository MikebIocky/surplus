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

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;
if (!cached) {
  cached = { conn: null, promise: null };
  (global as any).mongoose = cached;
}

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