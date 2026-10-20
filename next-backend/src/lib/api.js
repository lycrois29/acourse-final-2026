import { ObjectId } from 'mongodb';
import { successResponse, errorResponse } from './utils';
export const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
export function id(value) {
  if (!/^[a-f0-9]{24}$/i.test(value || '')) fail('Invalid identifier');
  return new ObjectId(value);
}
export async function body(req) {
  try { const value = await req.json(); if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Expected a JSON object'); return value; }
  catch { fail('Invalid JSON body'); }
}
export function endpoint(handler) {
  return async (...args) => {
    try { return await handler(...args); }
    catch (error) {
      if (!error.status) console.error('API failure:', error.message);
      return errorResponse(error.status ? error.message : 'Service unavailable. Check the database configuration and try again.', error.status || 503);
    }
  };
}
export const ok = successResponse;
export function courseInput(data) {
  const { name, duration, topics, price, maxStudent, status } = data;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) fail('Course name must contain 1–120 characters');
  if (!Number.isInteger(duration) || duration < 1 || duration > 3650) fail('Duration must be between 1 and 3650 days');
  if (!Array.isArray(topics) || topics.length < 1 || topics.length > 30 || topics.some(t => typeof t !== 'string' || !t.trim() || t.trim().length > 100)) fail('Provide 1–30 topics, each up to 100 characters');
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 1000000) fail('Price must be between 0 and 1,000,000');
  if (!Number.isInteger(maxStudent) || maxStudent < 1 || maxStudent > 10000) fail('Maximum students must be between 1 and 10,000');
  if (!['Open', 'Close', 'Cancel'].includes(status)) fail('Invalid course status');
  return { name: name.trim(), duration, topics: [...new Set(topics.map(t => t.trim()))], price, maxStudent, status };
}
export function courseView(course, user) {
  const { students = [], ...safe } = course;
  return { ...safe, enrolledCount: students.length, seatsRemaining: course.maxStudent - students.length, enrolled: students.includes(String(user._id)) };
}
