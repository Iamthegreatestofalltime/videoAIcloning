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
  const { userInput, platform, userId } = await request.json();
  console.log(`Received message for user: ${userId} on platform: ${platform}`);

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

    let needed = '';
    if(platform == "twitter"){
      needed = "(no video script) write a post that is under 110 characters so it fits in a tweet, and make it so that this post will help the user get more customers, so this can be providing value for their niche so they gain trust";
    }
    else if(platform == "tiktok" || platform == "instagram"){
      needed = "first off this is a script, so you need to write the actual script don't give as much reccomendations as actual script. Also make sure that you don't do any cheesy greetings because attention spans are low just start fast in the introduction you get like half a second to get ICP's attention, Provide: 1. An attention-grabbing title 2. A brief, engaging description 3. A detailed script including: - Hook (first 3 seconds) - Main content (broken down into clear sections) - Call to action";
    }
    else if(platform == "Facebook"){
      needed = "(no video script) write a post for facebook that will help the user get customers for their ICP (Ideal client profile), you can even give visual reccomendations but write out the copy and reccomendations for what to include in visuals";
    }
    else{
      needed = "(no video script) because this post is for linkedin, write a proffesional post for this user to attract their ICP, write copy that provides value to their ICP to gain trust";
    }

    console.log(platform + " : " + needed);

    const prompt = `
    Based on the following data from successful ${platform} videos in the users niche:
    
    ${JSON.stringify(userData.data, null, 2)}
    
    Generate a script for a new ${platform} video or post on the topic: "${userInput}".
    The script should be for the users niche that is informative and provides value to potential customers.
    Incorporate elements that made the reference videos or posts successful, while being original and tailored to the new topic.
    Focus on creating content that will attract customers to the users business. make sure to understand platform contstraints.
    
    ${needed}
    
    The script should be concise, informative, and designed to perform well on ${platform}.
    `;

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
  } finally {
    if (client) {
      await client.close();
    }
  }
}