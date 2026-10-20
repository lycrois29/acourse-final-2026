import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { seed } from './seed.mjs';
const mongo = await MongoMemoryServer.create({ binary: { version: '8.0.17' } });
const uri = mongo.getUri();
await seed(uri, 'course_demo');
const backend = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3000'], { stdio: 'inherit', env: { ...process.env, MONGODB_URI: uri, MONGODB_DB: 'course_demo', JWT_SECRET: randomBytes(48).toString('hex'), FRONTEND_ORIGIN: 'http://localhost:5173' } });
const frontend = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], { cwd: resolve('../react-frontend'), stdio: 'inherit' });
let stopping = false;
async function stop() {
  if (stopping) return; stopping = true;
  backend.kill(); frontend.kill(); await mongo.stop(); process.exit();
}
process.on('SIGINT', stop); process.on('SIGTERM', stop);
backend.on('exit', stop); frontend.on('exit', stop);
console.log('Temporary MongoDB demo. Data resets on exit. Open http://localhost:5173');
