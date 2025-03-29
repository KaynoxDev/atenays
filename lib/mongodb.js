import { MongoClient } from 'mongodb';

// Cached connection
let cachedClient = null;
let cachedDb = null;

// Function to create a MongoDB client with proper options
function createClient(uri) {
  return new MongoClient(uri, {
    connectTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
    serverSelectionTimeoutMS: 10000, // 10 seconds
  });
}

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!process.env.MONGODB_DB) {
    throw new Error('Please define the MONGODB_DB environment variable');
  }

  try {
    // Create a new MongoDB client with our options
    const client = createClient(process.env.MONGODB_URI);
    
    // Attempt to connect to MongoDB
    await client.connect();
    console.log('MongoDB connected successfully!');
    
    // Get a reference to the database
    const db = client.db(process.env.MONGODB_DB);

    // Cache the client and db connections
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // Check if it's an SSL error and provide more details
    if (error.message && error.message.includes('SSL')) {
      console.error('SSL/TLS Error - This might be due to:');
      console.error(' - MongoDB requiring a newer TLS version');
      console.error(' - Certificate issues');
      console.error(' - Incorrect connection string');
      
      // If in development, we could try with disabled SSL validation
      if (process.env.NODE_ENV !== 'production' && !process.env.MONGODB_URI.includes('tlsInsecure=true')) {
        console.error('Trying alternative connection for development...');
        try {
          // Add parameters to disable strict SSL checking for development
          const altUri = process.env.MONGODB_URI + 
            (process.env.MONGODB_URI.includes('?') ? '&' : '?') + 
            'tlsInsecure=true&tlsAllowInvalidCertificates=true';
          
          const client = createClient(altUri);
          await client.connect();
          
          const db = client.db(process.env.MONGODB_DB);
          cachedClient = client;
          cachedDb = db;
          
          console.log('Connected with relaxed SSL settings (development only)');
          return { client, db };
        } catch (altError) {
          console.error('Alternative connection failed:', altError);
        }
      }
    }
    
    throw new Error(`Failed to connect to database: ${error.message}`);
  }
}
