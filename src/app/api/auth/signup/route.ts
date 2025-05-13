// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/models/User'; // Ensure IUser is imported
import mongoose from 'mongoose';

// --- Define Response Body Interfaces ---
interface SignupSuccessResponse {
  message: string;
  user: { // Ensure this user object structure is returned
    id: string; // <-- THE CRUCIAL PART
    name: string;
    email: string;
  };
}
interface ErrorResponse { error: string; }

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { name, email, password } = await req.json();

    // ... (validation checks remain the same) ...
    if (!name || !email || !password) return NextResponse.json<ErrorResponse>({ error: 'Missing required fields' }, { status: 400 });
    if (password.length < 6) return NextResponse.json<ErrorResponse>({ error: 'Password must be at least 6 characters' }, { status: 400 });
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) return NextResponse.json<ErrorResponse>({ error: 'Email already in use' }, { status: 409 });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user instance
    const newUser = new User({ name, email, password: hashedPassword });

    // Save the user to the database
    await newUser.save();

    // --- Prepare Successful Response ---
    // Use .toObject() for a plain object
    const userObject = newUser.toObject<IUser & { _id: mongoose.Types.ObjectId }>();

    // Create the typed success response body INCLUDING THE ID
    const successResponseBody: SignupSuccessResponse = {
      message: 'User created successfully',
      user: {
        id: userObject._id.toString(), // Convert ObjectId to string
        name: userObject.name,
        email: userObject.email,
      }
    };

    // Return typed successful response
    return NextResponse.json<SignupSuccessResponse>(successResponseBody, { status: 201 });

  } catch (error: unknown) {
    // ... (error handling remains the same) ...
    console.error('Signup API Error:', error);
    // Handle specific Mongoose validation errors
     if (error instanceof mongoose.Error.ValidationError) {
       const messages = Object.values((error as { errors: Record<string, { message: string }> }).errors).map((err) => err.message);
       return NextResponse.json<ErrorResponse>({ error: `Validation failed: ${messages.join(', ')}` }, { status: 400 });
     }
     return NextResponse.json<ErrorResponse>({ error: 'An internal server error occurred' }, { status: 500 });
  }
}