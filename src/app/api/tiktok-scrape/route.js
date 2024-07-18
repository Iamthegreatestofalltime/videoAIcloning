import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { upsertDocument } from '../../../scripts/dbOperations';

const execAsync = promisify(exec);

// Custom JSON parse function to handle NaN
function parseJSON(text) {
  return JSON.parse(text, (key, value) =>
    typeof value === 'number' && isNaN(value) ? null : value
  );
}

export async function POST(request) {
  const { username, userId } = await request.json();
  console.log(`Starting TikTok scraping process for username: ${username}`);

  return new Promise((resolve) => {
    console.log('Spawning Python process...');
    const pythonProcess = spawn('python', ['src/scripts/tiktok_scraper.py', username]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      console.log(chunk);
      output += chunk;
    });

    pythonProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      console.error(chunk);
      error += chunk;
    });

    pythonProcess.on('close', async (code) => {
      console.log(`Python script exited with code ${code}`);

      if (code !== 0) {
        console.error(`Error during TikTok scraping: ${error}`);
        resolve(NextResponse.json({ error: 'An error occurred during the scraping process' }, { status: 500 }));
      } else {
        console.log('TikTok scraping completed successfully');

        // Run Excel to JSON conversion
        console.log('Running Excel to JSON conversion...');
        try {
          await execAsync(`python src/scripts/excel_to_json.py ${username} tiktok`);
          console.log('Excel to JSON conversion completed');

          const jsonPath = path.join(process.cwd(), 'src', 'scripts', `${username}_tiktok_data.json`);
          const jsonData = await fs.readFile(jsonPath, 'utf-8');

          let data;
          try {
            data = parseJSON(jsonData);
          } catch (jsonError) {
            console.warn('Error parsing JSON, attempting to clean the data:', jsonError);
            // Attempt to clean the JSON string
            const cleanedJsonData = jsonData.replace(/:\s*NaN/g, ': null');
            data = parseJSON(cleanedJsonData);
          }

          // Store data in MongoDB
          const result = await upsertDocument('tiktokData', { userId }, { userId, data });

          resolve(NextResponse.json({
            message: 'TikTok scraping, conversion, and database storage completed successfully',
            data: data,
            itemCount: data.length,
            dbResult: result
          }));
        } catch (error) {
          console.error('Error during Excel to JSON conversion or database storage:', error);
          resolve(NextResponse.json({ error: 'An error occurred during the conversion or storage process' }, { status: 500 }));
        }
      }
    });
  });
}