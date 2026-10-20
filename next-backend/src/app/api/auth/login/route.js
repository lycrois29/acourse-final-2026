import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { database } from '@/lib/mongodb';
import { secret } from '@/lib/auth';
import { body, endpoint, fail, ok } from '@/lib/api';
export const POST = endpoint(async req => {
  const { login, password } = await body(req);
  if (typeof login !== 'string' || typeof password !== 'string' || login.length > 254 || password.length > 128) fail('Enter a valid username or email and password');
  const db = await database();
  const identity = login.trim().toLowerCase();
  const user = await db.collection('users').findOne({ $or: [{ email: identity }, { username: identity }] });
  if (!user || !await bcrypt.compare(password, user.password)) fail('Invalid username/email or password', 401);
  const jti = randomUUID();
  const token = jwt.sign({}, secret(), { subject: String(user._id), jwtid: jti, expiresIn: '8h', issuer: 'course-service', audience: 'course-ui', algorithm: 'HS256' });
  await db.collection('sessions').insertOne({ _id: jti, userId: String(user._id), expiresAt: new Date(Date.now() + 8 * 3600000) });
  const { password: _password, ...safeUser } = user;
  return ok({ token, user: safeUser }, 200);
});
