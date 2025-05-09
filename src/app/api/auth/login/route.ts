// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';        // For comparing password hashes
import jwt from 'jsonwebtoken';       // For creating JSON Web Tokens
import dbConnect from '@/lib/dbConnect'; // Database connection utility
import mongoose from 'mongoose';       // For Mongoose types if needed
import User, { IUser } from '@/models/User'; // Your User model and interface

// --- Define Response Interfaces ---

// Structure for successful login response (sent to client)
interface LoginSuccessResponse {
  message: string;
  user: { // Data needed for client-side state hydration (e.g., AuthContext)
    id: string;
    name: string;
    email: string;
    avatar?: string;
    description?: string;
    rating?: number;
    // Add any other user fields needed immediately by the client UI
  };
}

// Structure for error responses
interface ErrorResponse {
  error: string;
}

// --- JWT Secret Configuration ---
const JWT_SECRET = process.env.JWT_SECRET;

// Perform a check on startup (or module load) - this won't stop execution but logs a critical error
if (!JWT_SECRET) {
  console.error("FATAL SERVER CONFIG ERROR: JWT_SECRET environment variable is not defined!");
  // In a real production scenario, you might want the application to fail to start
  // throw new Error("FATAL SERVER CONFIG ERROR: JWT_SECRET environment variable is not defined!");
}

// --- API Route Handler ---
export async function POST(req: NextRequest) {
  console.log("[API LOGIN] Received login request."); // Log start

  // Runtime check for JWT_SECRET - essential for security
  if (!JWT_SECRET) {
    console.error("[API LOGIN] FATAL ERROR: JWT_SECRET missing at runtime!");
    return NextResponse.json<ErrorResponse>(
      { error: 'Server configuration error: Authentication service unavailable.' },
      { status: 503 } // Service Unavailable might be appropriate
    );
  }

  // 1. Establish Database Connection
  try {
    await dbConnect();
    // console.log("[API LOGIN] Database connected."); // Optional success log
  } catch (dbError) {
    console.error("[API LOGIN] Database Connection Error:", dbError);
    return NextResponse.json<ErrorResponse>({ error: 'Database connection error' }, { status: 503 });
  }

  // 2. Process Request
  try {
    const { email, password } = await req.json();
    console.log(`[API LOGIN] Attempting login for email: ${email}`); // Log email

    // 3. Validate Input
    if (!email || !password) {
        console.warn("[API LOGIN] Validation failed: Missing email or password.");
        return NextResponse.json<ErrorResponse>({ error: 'Please provide both email and password' }, { status: 400 });
    }

    // 4. Find User in Database
    const user = await User.findOne({ email: email.toLowerCase().trim() }) // Normalize email
                           .select('+password name email avatar description rating') // Include necessary fields
                           .lean<IUser & { _id: mongoose.Types.ObjectId; password?: string }>(); // Use lean for plain object

    // 5. Verify User Existence and Password Field
    if (!user) {
        console.warn(`[API LOGIN] User not found for email: ${email}`);
        return NextResponse.json<ErrorResponse>({ error: 'Invalid credentials' }, { status: 401 }); // Unauthorized
    }
    if (!user.password) {
         console.error(`[API LOGIN] User ${email} found but password hash is missing from DB query!`);
         // This indicates a potential issue with the model or the '.select("+password")'
         return NextResponse.json<ErrorResponse>({ error: 'Server error retrieving credentials' }, { status: 500 });
    }

    // 6. Compare Provided Password with Stored Hash
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.warn(`[API LOGIN] Invalid password for email: ${email}`);
      return NextResponse.json<ErrorResponse>({ error: 'Invalid credentials' }, { status: 401 }); // Unauthorized
    }

    // --- Authentication Successful ---
    console.log(`[API LOGIN] Password match successful for: ${email}`);

    // 7. Create JWT Payload
    const jwtPayload = {
      user: {
        id: user._id.toString(), // Primary identifier for the user
      },
      // Standard claims (optional but good practice)
      // iat: Math.floor(Date.now() / 1000), // Issued at time (handled by jwt.sign)
      // exp: Math.floor(Date.now() / 1000) + (60 * 60) // Expiration time (handled by jwt.sign expiresIn)
    };

    // 8. Sign the JWT
    const expiresIn = '1h'; // Define expiry duration
    const maxAgeSeconds = 60 * 60; // Match expiry in seconds for cookie
    const token = jwt.sign(
        jwtPayload,
        JWT_SECRET, // Already confirmed non-null above
        { expiresIn }
    );
    console.log(`[API LOGIN] JWT signed for user ID: ${user._id.toString()}`);

    // 9. Prepare User Data for Client Response Body
    // Exclude sensitive or unnecessary data like password hash
    const userResponseData = {
       id: user._id.toString(),
       name: user.name,
       email: user.email,
       avatar: user.avatar,
       description: user.description,
       rating: user.rating,
    };

    // 10. Create the API Response (JSON Body)
    const responseBody: LoginSuccessResponse = {
        message: 'Login successful',
        user: userResponseData
    };
    const response = NextResponse.json(responseBody, { status: 200 });

    // 11. Set the HttpOnly Cookie
    const cookieOptions = {
        name: 'authToken',                           // Cookie name
        value: token,                                // The JWT
        httpOnly: true,                             // Cannot be accessed by client-side JS
        secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
        sameSite: 'lax' as const,                   // Use 'lax' or 'strict'. 'lax' is often a good balance.
        maxAge: maxAgeSeconds,                      // Cookie lifetime in seconds (e.g., 1 hour)
        path: '/',                                  // Make cookie available across the entire site
        // domain: '.yourdomain.com' // Optional: Specify domain if needed for subdomains
    };
    response.cookies.set(cookieOptions); // Use the object form to set the cookie
    console.log("[API LOGIN] HttpOnly cookie set with options:", cookieOptions);

    return response; // Send response with JSON body and Set-Cookie header

  } catch (error) {
    console.error("[API LOGIN] Error:", error);
    if (error instanceof Error) {
      return NextResponse.json<ErrorResponse>({ error: error.message }, { status: 500 });
    }
    return NextResponse.json<ErrorResponse>({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}