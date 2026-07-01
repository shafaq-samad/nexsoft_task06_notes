import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export const db = {
  connect: async (): Promise<Db | null> => {
    const candidateUris = [process.env.MONGODB_URI, process.env.DIRECT_MONGODB_URI].filter(Boolean) as string[];
    if (candidateUris.length === 0) {
      return null;
    }

    if (cachedDb) {
      return cachedDb;
    }

    for (const uri of candidateUris) {
      try {
        const client = new MongoClient(uri);
        await client.connect();
        cachedClient = client;
        cachedDb = client.db(process.env.MONGODB_DB || "notes_db");
        return cachedDb;
      } catch (error) {
        console.warn("MongoDB connection failed for configured URI, trying fallback if available.");
        console.warn(error);
      }
    }

    return null;
  },
};
