import { NextResponse } from 'next/server';
import { insertDocument, findDocuments, updateDocument } from '../../../scripts/dbOperations';

export async function POST(request) {
  const { collection, data } = await request.json();
  try {
    let result;
    switch (collection) {
      case 'users':
        result = await insertDocument('users', data);
        break;
      case 'instagramData':
        result = await updateDocument('instagramData', { userId: data.userId }, data, { upsert: true });
        break;
      case 'tiktokData':
        result = await updateDocument('tiktokData', { userId: data.userId }, data, { upsert: true });
        break;
      default:
        return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Document inserted/updated successfully', result });
  } catch (error) {
    console.error('Error inserting/updating document:', error);
    return NextResponse.json({ error: 'Failed to insert/update document' }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get('collection');
  const userId = searchParams.get('userId');

  try {
    let documents;
    switch (collection) {
      case 'users':
        documents = await findDocuments('users', userId ? { _id: userId } : {});
        break;
      case 'instagramData':
        documents = await findDocuments('instagramData', { userId });
        break;
      case 'tiktokData':
        documents = await findDocuments('tiktokData', { userId });
        break;
      default:
        return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}