// File: src/app/api/available-platforms/route.js
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Make sure to set this environment variable in your .env.local file
const uri = 'mongodb+srv://alexlotkov124:Cupworld@cluster0.lrf5prc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

if (!uri) {
  console.error('MONGODB_URI is not set in the environment variables');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('AISocialMedia');

    const instagramData = await db.collection('instagramData').findOne({ userId });
    const tiktokData = await db.collection('tiktokData').findOne({ userId });

    const availablePlatforms = [];
    if (instagramData) availablePlatforms.push('instagram');
    if (tiktokData) availablePlatforms.push('tiktok');

    return NextResponse.json(availablePlatforms);
  } catch (error) {
    console.error('Error fetching available platforms:', error);
    return NextResponse.json({ error: 'An error occurred while fetching available platforms' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}