import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export const db = {
  connect: async (): Promise<Db | null> => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return null;
    }

    if (cachedDb) {
      return cachedDb;
    }

    try {
      const client = new MongoClient(uri);
      await client.connect();
      cachedClient = client;
      cachedDb = client.db(process.env.MONGODB_DB || "notes_db");
      return cachedDb;
    } catch (error) {
      console.warn("MongoDB connection failed for configured MONGODB_URI.");
      console.warn(error);
      return null;
    }
  },
};
