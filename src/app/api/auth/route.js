import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { insertDocument, findDocuments } from '../../../scripts/dbOperations';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your_jwt_secret';

export async function POST(request) {
  const { action, username, email, password } = await request.json();

  if (action === 'register') {
    // Check if user already exists
    const existingUser = await findDocuments('users', { $or: [{ username }, { email }] });
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = { username, email, password: hashedPassword };
    const result = await insertDocument('users', newUser);

    // Generate JWT
    const token = jwt.sign({ id: result.insertedId }, JWT_SECRET, { expiresIn: '1h' });

    return NextResponse.json({ message: 'User registered successfully', token });

  } else if (action === 'login') {
    // Find user
    const user = (await findDocuments('users', { username }))[0];
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    if (isMatch) {
      const accessToken = jwt.sign(
        { 
          userId: user._id,
          username: user.username,
          exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes from now
        },
        JWT_SECRET
      );
  
      const refreshToken = jwt.sign(
        { userId: user._id },
        REFRESH_SECRET,
        { expiresIn: '7d' } // 7 days
      );
  
      // Send tokens to client
      return NextResponse.json({ 
        accessToken, 
        refreshToken,
        userId: user._id, 
        username: user.username 
      });
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ message: 'Logged in successfully', token });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}