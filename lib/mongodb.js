import { MongoClient } from 'mongodb';

// Use environment variables with robust fallbacks
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

// Validate environment variables early
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
}

if (!MONGODB_DB) {
  console.error('MONGODB_DB is not defined in environment variables');
}

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
    
    // Create a new MongoDB client with robust options
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      retryWrites: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
    });

    await client.connect();
    console.log('Connected to MongoDB successfully');
    
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

export async function disconnectFromDatabase() {
  if (cachedClient) {
    try {
      await cachedClient.close();
      cachedClient = null;
      cachedDb = null;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }
}
