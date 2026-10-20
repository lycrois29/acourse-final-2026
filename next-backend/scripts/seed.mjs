import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { pathToFileURL } from 'node:url';
try { process.loadEnvFile('.env.local'); } catch {}
export const demoPassword = 'LearnTogether!2026';
export async function seed(uri = process.env.MONGODB_URI, dbName = process.env.MONGODB_DB || 'course_service') {
  if (!uri) throw new Error('Set MONGODB_URI before seeding');
  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(dbName);
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('courses').createIndex({ teacherId: 1 });
    await db.collection('courses').createIndex({ status: 1 });
    await db.collection('courses').createIndex({ students: 1 });
    const hash = await bcrypt.hash(demoPassword, 12);
    const users = ['teacher1', 'teacher2', 'teacher3', 'student1', 'student2', 'student3'].map((username, i) => ({ _id: new ObjectId((i + 1).toString(16).padStart(24, '0')), username, email: username + '@acourse.test', password: hash, role: username.startsWith('teacher') ? 'Teacher' : 'Student' }));
    for (const user of users) await db.collection('users').updateOne({ _id: user._id }, { $setOnInsert: user }, { upsert: true });
    const definitions = [
      ['Practical web development', 0, ['HTML & CSS', 'React', 'Next.js APIs'], 21, 149, 24, 'Open', [3]],
      ['Design thinking, made practical', 1, ['Research', 'Prototyping', 'Design systems'], 14, 89, 18, 'Open', []],
      ['Make sense of your data', 2, ['Data analysis', 'Visualization', 'Storytelling'], 10, 99, 16, 'Open', [4]],
      ['The foundations of photography', 1, ['Composition', 'Lighting', 'Editing'], 7, 59, 20, 'Close', []],
      ['Build your first API', 0, ['Node.js', 'REST', 'MongoDB'], 14, 119, 2, 'Open', [3, 4]],
      ['Creative writing workshop', 2, ['Ideas', 'Structure', 'Editing'], 5, 0, 12, 'Open', []],
      ['Archived JavaScript workshop', 0, ['JavaScript'], 3, 39, 10, 'Cancel', []],
    ];
    for (const [i, [name, teacher, topics, duration, price, maxStudent, status, enrolled]] of definitions.entries()) {
      const _id = new ObjectId((101 + i).toString(16).padStart(24, '0'));
      await db.collection('courses').updateOne({ _id }, { $setOnInsert: { _id, name, teacherId: String(users[teacher]._id), teacherName: users[teacher].username, topics, duration, price, maxStudent, status, students: enrolled.map(index => String(users[index]._id)), createdAt: new Date(Date.UTC(2026, 9, 20, 0, i)) } }, { upsert: true });
    }
    console.log('Seed ready: 3 Teachers, 3 Students; 7 sample courses. Existing records preserved.');
  } finally { await client.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await seed();
