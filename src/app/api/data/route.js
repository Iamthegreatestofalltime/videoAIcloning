import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const uri = 'mongodb+srv://alexlotkov124:Cupworld@cluster0.lrf5prc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

if (!uri) {
  console.error('MONGODB_URI is not set in the environment variables');
}

const JWT_SECRET = 'your_jwt_secret';

console.log('JWT_SECRET:', JWT_SECRET); // Log the secret (remove in production)

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in the environment variables');
}

function getAuthenticatedUserId(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;  // Make sure this matches the property name in your token
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId');
  const platform = searchParams.get('platform');

  const authenticatedUserId = getAuthenticatedUserId(request);

  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (authenticatedUserId !== requestedUserId) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('AISocialMedia');
    const collection = platform === 'instagram' ? 'instagramData' : 'tiktokData';
    const data = await db.collection(collection).findOne({ userId: authenticatedUserId });

    if (!data) {
      return NextResponse.json({ error: 'No data found for this user and platform' }, { status: 404 });
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'An error occurred while fetching data' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function POST(request) {
  const { userId, platform, data } = await request.json();

  const authenticatedUserId = getAuthenticatedUserId(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!userId || !platform || !data) {
    return NextResponse.json({ error: 'userId, platform, and data are required' }, { status: 400 });
  }

  if (authenticatedUserId !== userId) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('AISocialMedia');

    const collection = platform === 'instagram' ? 'instagramData' : 'tiktokData';
    await db.collection(collection).updateOne(
      { userId: authenticatedUserId },
      { $set: { data } },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error updating data:', error);
    return NextResponse.json({ error: 'An error occurred while updating data' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}