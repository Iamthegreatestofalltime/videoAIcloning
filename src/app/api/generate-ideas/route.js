import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const uri = 'mongodb+srv://alexlotkov124:Cupworld@cluster0.lrf5prc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function POST(request) {
  console.log('Received POST request to /api/generate-ideas');
  
  let requestBody;
  try {
    requestBody = await request.json();
    console.log('Request body:', requestBody);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { username, platform, userId } = requestBody;

  if (!username || !platform || !userId) {
    console.error('Missing required fields in request body');
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let client;
  let tempFilePath;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('AISocialMedia');
    const collection = platform === 'instagram' ? 'instagramData' : 'tiktokData';
    const userData = await db.collection(collection).findOne({ userId });

    if (!userData) {
      console.error(`No data found for userId: ${userId}, platform: ${platform}`);
      return NextResponse.json({ error: 'No data found for this user and platform' }, { status: 404 });
    }

    console.log('User data found:', userData);

    // Create a temporary file with the user data
    tempFilePath = path.join(os.tmpdir(), `userData_${userId}_${Date.now()}.json`);
    await fs.writeFile(tempFilePath, JSON.stringify(userData.data), 'utf8');
    console.log('Temporary file created:', tempFilePath);

    console.log('Spawning Python process...');
    const pythonProcess = spawn('python', ['src/scripts/generate_ideas.py', tempFilePath]);
    
    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    return new Promise((resolve) => {
      pythonProcess.on('close', async (code) => {
        console.log(`Python process exited with code ${code}`);
        console.log('Python script output:', output);
        console.log('Python script error output:', errorOutput);

        // Clean up the temporary file
        try {
          await fs.access(tempFilePath);
          await fs.unlink(tempFilePath);
          console.log('Temporary file deleted successfully');
        } catch (error) {
          console.error('Error deleting temporary file:', error);
        }

        if (code !== 0) {
          console.error(`Python script exited with code ${code}`);
          resolve(NextResponse.json({ 
            error: 'Failed to generate ideas', 
            details: errorOutput,
            pythonOutput: output
          }, { status: 500 }));
        } else {
          try {
            const ideas = JSON.parse(output);
            if (ideas.length === 1 && ideas[0].startsWith('Error:')) {
              resolve(NextResponse.json({ 
                error: ideas[0], 
                details: errorOutput,
                pythonOutput: output
              }, { status: 500 }));
            } else {
              resolve(NextResponse.json({ ideas }));
            }
          } catch (error) {
            console.error('Error parsing Python script output:', error);
            resolve(NextResponse.json({ 
              error: 'Failed to parse ideas', 
              details: error.message,
              pythonOutput: output
            }, { status: 500 }));
          }
        }
      });
    });

  } catch (error) {
    console.error('Error in generate-ideas route:', error);
    return NextResponse.json({ error: 'An error occurred while generating ideas', details: error.message }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}