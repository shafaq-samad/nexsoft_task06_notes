import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectPromise: Promise<Db | null> | null = null;
let lastConnectAttempt = 0;
let lastConnectError: unknown = null;
const RETRY_INTERVAL_MS = 30000;

const createMongoClient = (uri: string) =>
  new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 20000,
    retryWrites: true,
    maxPoolSize: 10,
    tls: true,
    family: 4,
  });

export const db = {
  connect: async (): Promise<Db | null> => {
    if (cachedDb) {
      return cachedDb;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return null;
    }

    if (lastConnectError && Date.now() - lastConnectAttempt < RETRY_INTERVAL_MS) {
      return null;
    }

    if (connectPromise) {
      return connectPromise;
    }

    connectPromise = (async () => {
      try {
        const client = createMongoClient(uri);
        await client.connect();
        cachedClient = client;
        cachedDb = client.db(process.env.MONGODB_DB || "notes_db");
        lastConnectError = null;
        return cachedDb;
      } catch (error) {
        lastConnectAttempt = Date.now();
        lastConnectError = error;
        cachedClient = null;
        cachedDb = null;
        console.warn("MongoDB connection failed for configured MONGODB_URI.");
        console.warn("Check Atlas network access and that the URI is correct for your deployment environment.");
        console.warn(error);
        return null;
      } finally {
        connectPromise = null;
      }
    })();

    return connectPromise;
  },
};

export const initializeMongo = async (): Promise<void> => {
  const database = await db.connect();
  if (!database) {
    return;
  }

  try {
    await database.collection("users").createIndex({ email: 1 }, { unique: true });
    await database.collection("users").createIndex({ username: 1 }, { unique: true });
    await database.collection("notes").createIndex({ userId: 1, updatedAt: -1 });
  } catch (error) {
    console.warn("MongoDB initialization warning:", error);
  }
};
