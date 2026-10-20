import { requireUser } from '@/lib/auth';
import { database } from '@/lib/mongodb';
import { endpoint, body, courseInput, courseView, fail, id, ok } from '@/lib/api';
async function contextFor(req, context, role) {
  const user = await requireUser(req, role);
  const db = await database();
  const _id = id((await context.params).course_id);
  const course = await db.collection('courses').findOne({ _id });
  if (!course || (user.role === 'Teacher' ? course.teacherId !== String(user._id) : course.status === 'Cancel')) fail('Course not found', 404);
  return { user, db, course, _id };
}
export const GET = endpoint(async (req, context) => {
  const { user, db, course } = await contextFor(req, context);
  const result = courseView(course, user);
  if (user.role === 'Teacher') result.students = await db.collection('users').find({ _id: { $in: course.students.map(id) } }, { projection: { username: 1, email: 1 } }).toArray();
  return ok({ course: result }, 200);
});
export const PUT = endpoint(async (req, context) => {
  const { user, db, _id } = await contextFor(req, context, 'Teacher');
  const data = courseInput(await body(req));
  const updated = await db.collection('courses').findOneAndUpdate({ _id, teacherId: String(user._id), $expr: { $lte: [{ $size: '$students' }, data.maxStudent] } }, { $set: { ...data, updatedAt: new Date() } }, { returnDocument: 'after' });
  if (!updated) fail('Maximum students cannot be lower than the enrolled count. Refresh and try again.', 409);
  return ok({ course: courseView(updated, user) }, 200);
});
export const DELETE = endpoint(async (req, context) => {
  const { user, db, _id } = await contextFor(req, context, 'Teacher');
  const result = await db.collection('courses').deleteOne({ _id, teacherId: String(user._id), students: { $size: 0 } });
  if (!result.deletedCount) fail('A course with enrolled students cannot be deleted', 409);
  return ok({ message: 'Course deleted' }, 200);
});
