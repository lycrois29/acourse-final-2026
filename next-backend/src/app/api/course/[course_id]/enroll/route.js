import { requireUser } from '@/lib/auth';
import { database } from '@/lib/mongodb';
import { endpoint, courseView, fail, id, ok } from '@/lib/api';
export const POST = endpoint(async (req, context) => {
  const user = await requireUser(req, 'Student');
  const _id = id((await context.params).course_id);
  const studentId = String(user._id);
  const courses = (await database()).collection('courses');
  // The atomic filter serializes enrollment with course status, capacity, and deletion changes.
  const course = await courses.findOneAndUpdate({ _id, status: 'Open', students: { $ne: studentId }, $expr: { $lt: [{ $size: '$students' }, '$maxStudent'] } }, { $addToSet: { students: studentId } }, { returnDocument: 'after' });
  if (!course) {
    const existing = await courses.findOne({ _id });
    if (!existing || existing.status === 'Cancel') fail('Course not found', 404);
    if (existing.students.includes(studentId)) fail('You are already enrolled in this course', 409);
    fail(existing.status !== 'Open' ? 'This course is closed for enrollment' : 'This course is full', 409);
  }
  return ok({ course: courseView(course, user), message: 'Enrollment confirmed' }, 201);
});
