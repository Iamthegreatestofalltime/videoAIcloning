import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient } from 'mongodb';
import { PineconeClient } from "@pinecone-database/pinecone";
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

const genAI = new GoogleGenerativeAI('AIzaSyDmS0chxAp5z0qD4XYQMfbNTw-wpNkv6Bc');
const mongoUri = 'mongodb+srv://alexlotkov124:Cupworld@cluster0.lrf5prc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const pinecone = new PineconeClient();
await pinecone.init({
  environment: "aped-4627-b74a",
  apiKey: '4d4d6def-9f0c-4000-972e-c32cbd5064b0'
});

const index = pinecone.Index("instagramdata");

const embeddings = new OpenAIEmbeddings();

async function indexDocument(text, metadata) {
    const docs = [new Document({ pageContent: text, metadata })];
    await PineconeStore.fromDocuments(docs, embeddings, { pineconeIndex: index });
  }
  
  async function queryVectorStore(query, k = 5) {
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });
    const results = await vectorStore.similaritySearch(query, k);
    return results.map(doc => doc.pageContent).join('\n');
  }

async function getGeminiCompletion(userInput, platform, userData, relevantContext) {
  const promptMap = {
    instagram: `Generate a script for an Instagram reel`,
    tiktok: `Generate a script for a TikTok video`,
    linkedin: `Generate a post for LinkedIn`,
    facebook: `Generate a post for Facebook`,
    twitter: `Generate a tweet for Twitter`,
  };

  const basePrompt = promptMap[platform] || "Generate content";

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `${basePrompt} for my business, using the context to see what works and what does not. 
    Additional context: ${JSON.stringify(userData)}
    Relevant information: ${relevantContext}
    User input: ${userInput}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

export async function generateContent(userInput, platform, userId) {
  let mongoClient;
  try {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log('Connected to MongoDB');

    const db = mongoClient.db('AISocialMedia');
    const collection = platform === 'instagram' || platform === 'tiktok' ? `${platform}Data` : 'userData';
    const userData = await db.collection(collection).findOne({ userId });

    if (!userData) {
      throw new Error('No data found for this user and platform');
    }

    // Query vector store for relevant information
    const relevantContext = await queryVectorStore(userInput);

    const generatedContent = await getGeminiCompletion(userInput, platform, userData.data, relevantContext);
    return generatedContent;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

// Function to add new documents to the vector store
export async function addDocument(text, metadata) {
  await indexDocument(text, metadata);
}