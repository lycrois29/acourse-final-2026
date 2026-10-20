import { requireUser } from '@/lib/auth';
import { database } from '@/lib/mongodb';
import { endpoint, body, courseInput, courseView, ok } from '@/lib/api';
export const GET = endpoint(async req => {
  const user = await requireUser(req);
  const query = user.role === 'Teacher' ? { teacherId: String(user._id) } : { status: { $ne: 'Cancel' } };
  const params = new URL(req.url).searchParams;
  if (params.get('enrolled') === 'true' && user.role === 'Student') query.students = String(user._id);
  let courses = await (await database()).collection('courses').find(query).sort({ createdAt: -1 }).toArray();
  const search = (params.get('q') || '').trim().toLowerCase();
  if (search) courses = courses.filter(c => c.name.toLowerCase().includes(search) || c.teacherName.toLowerCase().includes(search));
  return ok({ courses: courses.map(c => courseView(c, user)) }, 200);
});
export const POST = endpoint(async req => {
  const user = await requireUser(req, 'Teacher');
  const data = courseInput(await body(req));
  const course = { ...data, teacherId: String(user._id), teacherName: user.username, students: [], createdAt: new Date() };
  const result = await (await database()).collection('courses').insertOne(course);
  return ok({ course: courseView({ ...course, _id: result.insertedId }, user) }, 201);
});
