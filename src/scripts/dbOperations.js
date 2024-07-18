const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = 'mongodb+srv://alexlotkov124:Cupworld@cluster0.lrf5prc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('AISocialMedia');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function insertDocument(collection, document) {
  const db = await connectToDatabase();
  const result = await db.collection(collection).insertOne(document);
  console.log(`Inserted document with _id: ${result.insertedId}`);
  return result;
}

async function findDocuments(collection, query = {}) {
  const db = await connectToDatabase();
  if (query._id) {
    query._id = new ObjectId(query._id);
  }
  const result = await db.collection(collection).find(query).toArray();
  console.log(`Found ${result.length} documents`);
  return result;
}

async function updateDocument(collection, filter, update, options = {}) {
  const db = await connectToDatabase();
  const result = await db.collection(collection).updateOne(filter, { $set: update }, options);
  console.log(`Modified ${result.modifiedCount} document(s)`);
  return result;
}

async function deleteDocument(collection, filter) {
  const db = await connectToDatabase();
  const result = await db.collection(collection).deleteOne(filter);
  console.log(`Deleted ${result.deletedCount} document(s)`);
  return result;
}

async function upsertDocument(collection, filter, document) {
  const db = await connectToDatabase();
  const result = await db.collection(collection).updateOne(
    filter,
    { $set: document },
    { upsert: true }
  );
  console.log(`Upserted document with _id: ${result.upsertedId || filter._id}`);
  return result;
}

module.exports = {
  insertDocument,
  findDocuments,
  updateDocument,
  deleteDocument,
  upsertDocument
};