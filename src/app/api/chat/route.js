import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://alexlotkov124:Cupworld@cluster0.lrf5prc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
if (!uri) {
  console.error('MONGODB_URI is not set in the environment variables');
}

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

async function* generateStreamingResponse(prompt) {
  const response = await fetch(OLLAMA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3',
      prompt: prompt,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.trim() !== '') {
        const jsonLine = JSON.parse(line);
        if (jsonLine.response) {
          yield jsonLine.response;
        }
      }
    }
  }
}

export async function POST(request) {
  const { message, username, platform, userId } = await request.json();
  console.log(`Received message for user: ${username} on platform: ${platform}`);

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('AISocialMedia');
    const collection = platform === 'instagram' ? 'instagramData' : 'tiktokData';
    const userData = await db.collection(collection).findOne({ userId });

    if (!userData) {
      return NextResponse.json({ message: 'No data found for this user and platform' }, { status: 404 });
    }

    console.log('Found user data in MongoDB');

    const prompt = `Given this JSON data: ${JSON.stringify(userData.data)}\n\nUser query: ${message}`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generateStreamingResponse(prompt)) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Error:', error.message);
    return NextResponse.json({ message: `An error occurred while processing the request: ${error.message}` }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}