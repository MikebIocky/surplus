// src/models/Listing.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IUser } from './User'; // Import IUser interface for population typing

// Define the structure of the data for a Listing document
export interface IListing extends Document {
  _id: mongoose.Types.ObjectId; // Explicitly define _id for clarity
  title: string;
  description: string;
  images: Array<{
    url: string;
    publicId: string;
  }>;
  status: 'available' | 'pending' | 'claimed' | 'archived'; // Specific allowed statuses
  user: Types.ObjectId | IUser; // Reference to the User who posted it (can be populated)
  category: string; // Add category field

  // --- Fields often needed for display/details ---
  quantity?: string;         // Optional: Describes amount (e.g., "1 bunch", "500g")
  expiryDate?: Date;         // Optional: Best stored as Date for querying/sorting
  location?: string;         // Optional: General pickup location description
  contact?: string;          // Optional: Contact info provided by user

  // --- Fields for tracking claims (if using this model for it) ---
  // Alternative: Use a separate 'Order' or 'Claim' model
  claimedBy?: Types.ObjectId | IUser; // Optional: Reference to User who claimed it
  claimedAt?: Date;         // Optional: Timestamp when claimed

  // Timestamps managed by Mongoose
  createdAt: Date;
  updatedAt: Date;

  pendingClaim?: {
    user: Types.ObjectId | IUser;
    requestedAt: Date;
  };
}

// Define the Mongoose Schema corresponding to the IListing interface
const ListingSchema: Schema<IListing> = new Schema(
  {
    title: {
        type: String,
        required: [true, 'Listing title is required.'], // Add custom error message
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Listing description is required.'],
        trim: true
    },
    images: [{
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      }
    }],
    status: {
        type: String,
        enum: {
            values: ['available', 'pending', 'claimed', 'archived'], // Added 'pending'
            message: '{VALUE} is not a supported status.'
        },
        default: 'available',
        required: true,
        index: true
    },
    category: {
        type: String,
        required: [true, 'Category is required.'],
        enum: {
            values: ['produce', 'dairy', 'bakery', 'meat', 'pantry', 'other'],
            message: '{VALUE} is not a supported category.'
        },
        index: true // Add index for category filtering
    },
    user: { // The user who created the listing
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference the 'User' model
        required: true,
        index: true // Add index if you frequently query a user's listings
    },

    // --- Add schema definitions for the detail fields ---
    quantity: {
        type: String,
        trim: true
    },
    expiryDate: {
        type: Date // Storing as Date allows for easier date-based queries/logic
    },
    location: {
        type: String,
        trim: true
    },
    contact: {
        type: String,
        trim: true
    },
    // --- End detail fields ---

    // --- Add schema definitions for claim tracking (if managing here) ---
    claimedBy: { // The user who claimed/received the listing
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference the 'User' model
        index: true // Index if you query claimed items often
    },
    claimedAt: {
        type: Date
    },
    // --- End claim tracking fields ---

    pendingClaim: {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        requestedAt: { type: Date }
    },
  },
  {
    timestamps: true // Automatically add createdAt and updatedAt fields
  }
);

// Create and export the Mongoose model
// Check if model already exists to prevent overwrite errors during hot-reloading
const Listing: Model<IListing> = mongoose.models.Listing || mongoose.model<IListing>('Listing', ListingSchema);

export default Listing;