import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { upsertDocument } from '../../../scripts/dbOperations';

const execAsync = promisify(exec);

export async function POST(request) {
  console.log('Received POST request to /api/instagram-scrape');
  
  let username, userId;
  try {
    const body = await request.json();
    username = body.username;
    userId = body.userId;
    console.log(`Received request for username: ${username}, userId: ${userId}`);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!username || !userId) {
    console.error('Missing username or userId');
    return NextResponse.json({ error: 'Missing username or userId' }, { status: 400 });
  }

  console.log(`Starting Instagram scraping process for username: ${username}`);

  return new Promise((resolve) => {
    console.log('Spawning Python process...');
    const pythonProcess = spawn('python', ['src/scripts/instagram_scraper.py', username]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      console.log('Python script output:', chunk);
      output += chunk;
    });

    pythonProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      console.error('Python script error:', chunk);
      error += chunk;
    });

    pythonProcess.on('close', async (code) => {
      console.log(`Python script exited with code ${code}`);

      if (code !== 0) {
        console.error(`Error during Instagram scraping: ${error}`);
        resolve(NextResponse.json({ error: 'An error occurred during the scraping process', details: error }, { status: 500 }));
      } else {
        console.log('Instagram scraping completed successfully');

        // Run Excel to JSON conversion
        console.log('Running Excel to JSON conversion...');
        try {
          await execAsync(`python src/scripts/excel_to_json.py ${username} instagram`);
          console.log('Excel to JSON conversion completed');

          // The JSON file is now in the scripts directory
          const jsonPath = path.join(process.cwd(), 'src', 'scripts', `${username}_instagram_data.json`);
          console.log(`Attempting to read JSON file from: ${jsonPath}`);
          const jsonData = await fs.readFile(jsonPath, 'utf-8');
          const data = JSON.parse(jsonData);

          // Store data in MongoDB
          console.log('Storing data in MongoDB...');
          const result = await upsertDocument('instagramData', { userId }, { userId, data });
          console.log('MongoDB storage completed');

          resolve(NextResponse.json({
            message: 'Instagram scraping, conversion, and database storage completed successfully',
            data: data,
            itemCount: data.length,
            dbResult: result
          }));
        } catch (error) {
          console.error('Error during Excel to JSON conversion or database storage:', error);
          resolve(NextResponse.json({ error: 'An error occurred during the conversion or storage process', details: error.toString() }, { status: 500 }));
        }
      }
    });
  });
}