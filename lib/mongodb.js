import { MongoClient } from 'mongodb';

// Use environment variables with fallbacks
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

// Connection cache
let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  // If the connection is already established, return the cached connection
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    console.log('Connecting to MongoDB...');
    
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable');
    }
    
    if (!MONGODB_DB) {
      throw new Error('Please define the MONGODB_DB environment variable');
    }
    
    // Create a new MongoDB client with retry and connection pooling options
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10, // Keep up to 10 connections open
      retryWrites: true, // Automatically retry failed writes
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if no server found
      connectTimeoutMS: 10000, // Timeout after 10 seconds during connection
    });

    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error(error.stack);
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
}

// This helps avoid memory leaks on serverless environments
export async function disconnectFromDatabase() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('Disconnected from MongoDB');
  }
}
