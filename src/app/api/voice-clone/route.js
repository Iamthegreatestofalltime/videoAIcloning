// File: /app/api/voice-clone/route.js
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const text = formData.get('text');
    const audioFile = formData.get('audio');

    if (!text || !audioFile) {
      return NextResponse.json({ error: 'Missing text or audio file' }, { status: 400 });
    }

    // Ensure tmp directory exists
    const tmpDir = path.join(process.cwd(), 'tmp');
    try {
      await mkdir(tmpDir, { recursive: true });
    } catch (mkdirError) {
      console.error('Error creating tmp directory:', mkdirError);
      return NextResponse.json({ error: 'Failed to create temporary directory' }, { status: 500 });
    }

    // Save the audio file temporarily
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(tmpDir, 'input_audio.wav');
    try {
      await writeFile(filePath, buffer);
    } catch (writeError) {
      console.error('Error writing input file:', writeError);
      return NextResponse.json({ error: 'Failed to save input audio file' }, { status: 500 });
    }

    // Run the Python script
    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'td.py');
    const outputPath = path.join(process.cwd(), 'output.wav');

    return new Promise((resolve) => {
      exec(`python "${scriptPath}" "${text}" "${filePath}"`, async (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          console.error(`stderr: ${stderr}`);
          resolve(NextResponse.json({ error: 'Failed to process: ' + stderr }, { status: 500 }));
          return;
        }

        try {
          // Read the output audio file
          const outputBuffer = await readFile(outputPath);
          
          // Clean up temporary files
          await unlink(filePath);
          await unlink(outputPath);

          // Send the audio file as a blob
          const response = new NextResponse(outputBuffer);
          response.headers.set('Content-Type', 'audio/wav');
          response.headers.set('Content-Disposition', 'attachment; filename="cloned_voice.wav"');
          resolve(response);
        } catch (readError) {
          console.error('Error reading output file:', readError);
          resolve(NextResponse.json({ error: 'Failed to read output file' }, { status: 500 }));
        }
      });
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}