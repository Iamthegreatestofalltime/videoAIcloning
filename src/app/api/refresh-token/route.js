// File: src/app/api/refresh-token/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Here you would typically verify the user's refresh token
    // and check if the user is still valid in your database
    // For this example, we'll just create a new token

    const newToken = jwt.sign(
      { 
        userId: userId,
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
      },
      JWT_SECRET
    );

    return NextResponse.json({ token: newToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}