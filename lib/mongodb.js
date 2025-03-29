import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

// Validate environment variables
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!dbName) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Helper function to connect to the database with error handling
export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw new Error('Unable to connect to database');
  }
}
