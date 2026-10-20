import { MongoClient } from 'mongodb';
export function getClientPromise() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (!globalThis.courseMongo) {
    globalThis.courseMongo = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }).connect().catch(error => {
      globalThis.courseMongo = undefined;
      throw error;
    });
  }
  return globalThis.courseMongo;
}
export async function database() {
  return (await getClientPromise()).db(process.env.MONGODB_DB || 'course_service');
}
