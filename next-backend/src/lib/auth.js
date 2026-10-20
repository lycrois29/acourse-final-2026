import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { database } from './mongodb';
export function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must have at least 32 characters');
  return process.env.JWT_SECRET;
}
export function verifyJWT(req) {
  try {
    const header = req.headers.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return null;
    return jwt.verify(header.slice(7), secret(), { algorithms: ['HS256'], issuer: 'course-service', audience: 'course-ui' });
  } catch { return null; }
}
export async function requireUser(req, role) {
  const payload = verifyJWT(req);
  if (!payload || !ObjectId.isValid(payload.sub)) throw Object.assign(new Error('Please sign in to continue'), { status: 401 });
  const db = await database();
  const session = await db.collection('sessions').findOne({ _id: payload.jti, userId: payload.sub, expiresAt: { $gt: new Date() } });
  const user = session && await db.collection('users').findOne({ _id: new ObjectId(payload.sub) }, { projection: { password: 0 } });
  if (!user) throw Object.assign(new Error('Your session has expired. Please sign in again.'), { status: 401 });
  if (role && user.role !== role) throw Object.assign(new Error('This action is restricted to ' + role + 's'), { status: 403 });
  return user;
}
