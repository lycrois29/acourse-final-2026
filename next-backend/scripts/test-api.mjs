import assert from 'node:assert/strict';
const base = process.env.TEST_API_URL || 'http://localhost:3000/api';
let checks = 0;
const created = [];
async function call(path, token, method = 'GET', data, expected = 200) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(data !== undefined ? { body: typeof data === 'string' ? data : JSON.stringify(data) } : {}) });
  const result = await response.json().catch(() => ({}));
  assert.equal(response.status, expected, method + ' ' + path + ': ' + JSON.stringify(result));
  checks++; return result;
}
const password = 'LearnTogether!2026';
async function login(login) { return (await call('/auth/login', null, 'POST', { login, password })).token; }
const t1 = await login('teacher1'), t2 = await login('teacher2'), s1 = await login('student1'), s2 = await login('student2'), s3 = await login('student3@acourse.test');
await login('teacher3');
const course = { name: 'API integration test ' + Date.now(), duration: 5, topics: ['Security', 'Concurrency'], price: 20, maxStudent: 1, status: 'Open' };
async function create(data = course) {
  const { course: c } = await call('/course', t1, 'POST', data, 201); created.push(c._id); return c._id;
}
try {
  await call('/course', null, 'GET', undefined, 401);
  await call('/course', 'forged', 'GET', undefined, 401);
  await call('/course', s1, 'POST', course, 403);
  await call('/auth/login', null, 'POST', { login: 'teacher1', password: 'wrong' }, 401);
  await call('/auth/login', null, 'POST', '{', 400);
  const c = await create();
  await call('/course/' + c, t2, 'GET', undefined, 404);
  await call('/course/' + c, t2, 'PUT', course, 404);
  await call('/course/' + c, t2, 'DELETE', undefined, 404);
  await call('/course/' + c + '/enroll', t1, 'POST', undefined, 403);
  await call('/course/' + c, s1, 'PUT', course, 403);
  await call('/course/' + c, s1, 'DELETE', undefined, 403);
  await call('/course/' + c + '/enroll', s1, 'POST', undefined, 201);
  await call('/course/' + c + '/enroll', s1, 'POST', undefined, 409);
  await call('/course/' + c + '/enroll', s2, 'POST', undefined, 409);
  await call('/course/' + c, t1, 'DELETE', undefined, 409);
  await call('/course/' + c, t1, 'PUT', { ...course, maxStudent: 0 }, 400);
  const { course: detail } = await call('/course/' + c, t1);
  assert.equal(detail.students.length, 1); assert.equal(detail.students[0].username, 'student1'); assert.equal(detail.students[0].password, undefined);
  const { course: studentDetail } = await call('/course/' + c, s1);
  assert.equal(studentDetail.students, undefined); assert.equal(studentDetail.enrolled, true);
  const { courses: mine } = await call('/course?enrolled=true', s1); assert(mine.some(x => x._id === c));
  const { courses: own } = await call('/course', t2); assert(!own.some(x => x._id === c));
  const { courses: search } = await call('/course?q=' + encodeURIComponent(course.name), s2); assert(search.some(x => x._id === c));
  await call('/course/' + c, t1, 'PUT', { ...course, status: 'Close', maxStudent: 3 });
  await call('/course/' + c + '/enroll', s2, 'POST', undefined, 409);
  await call('/course/' + c, t1, 'PUT', { ...course, status: 'Cancel', maxStudent: 3 });
  await call('/course/' + c, s1, 'GET', undefined, 404);
  await call('/course/' + c + '/enroll', s2, 'POST', undefined, 404);
  const { courses: catalog } = await call('/course', s1); assert(!catalog.some(x => x._id === c)); assert(catalog.every(x => x.status !== 'Cancel'));
  await call('/course/' + c, t1, 'PUT', { ...course, status: 'Open', maxStudent: 3 });
  await Promise.all([call('/course/' + c + '/enroll', s2, 'POST', undefined, 201), call('/course/' + c + '/enroll', s3, 'POST', undefined, 201)]);
  await call('/course/' + c, t1, 'PUT', { ...course, maxStudent: 2 }, 409);
  const race = await create({ ...course, name: course.name + ' race' });
  const responses = await Promise.all([s1, s2, s3].map(token => fetch(base + '/course/' + race + '/enroll', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })));
  assert.deepEqual(responses.map(r => r.status).sort(), [201, 409, 409]); checks++;
  const duplicate = await create({ ...course, name: course.name + ' duplicate', maxStudent: 10 });
  const repeats = await Promise.all(Array.from({ length: 5 }, () => fetch(base + '/course/' + duplicate + '/enroll', { method: 'POST', headers: { Authorization: 'Bearer ' + s1 } })));
  assert.equal(repeats.filter(r => r.status === 201).length, 1); assert.equal(repeats.filter(r => r.status === 409).length, 4); checks++;
  const removable = await create(); await call('/course/' + removable, t1, 'DELETE');
  await call('/course/' + removable, t1, 'GET', undefined, 404);
  await call('/course/invalid', s1, 'GET', undefined, 400);
  await call('/user/000000000000000000000001', s1, 'GET', undefined, 403);
  const profile = await call('/user', s1); assert.equal(profile.user.password, undefined);
  const session = await login('student1');
  await call('/auth/logout', session, 'POST'); await call('/user', session, 'GET', undefined, 401);
  console.log('PASS: ' + checks + ' API checks, including simultaneous capacity and duplicate enrollment requests.');
} finally {
  // Fixtures with enrollments are deliberately retained for review; use an isolated demo database.
  console.log('Run these tests only against an isolated test/demo database. Fixture IDs: ' + created.join(', '));
}
