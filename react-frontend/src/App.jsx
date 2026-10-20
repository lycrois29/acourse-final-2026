import { useContext, useEffect, useState } from 'react';
import { HashRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { UserContext } from './context/UserContext';
import './App.css';
const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
function Notice({ error, children }) { return children ? <div className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>{children}</div> : null; }
function Badge({ status }) { return <span className={'badge ' + status.toLowerCase()}>{status === 'Close' ? 'Closed' : status === 'Cancel' ? 'Canceled' : 'Open'}</span>; }
function Login() {
  const { login } = useContext(UserContext);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const f = new FormData(e.currentTarget);
    try { await login(f.get('login'), f.get('password')); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="login-wrap"><section className="login-story"><a className="brand" href="#/">a<span>course</span></a><div><p className="eyebrow">A LITTLE CURIOSITY. A NEW POSSIBILITY.</p><h1>Your next chapter<br/>starts here.</h1><p>Find a course that moves you forward.<br/>Learn something useful. Make it yours.</p><div className="orbit" aria-hidden="true"><span>learn</span><span>create</span><span>grow ↗</span></div></div><p>Room for your next big idea.</p></section><section className="login-panel"><div className="login-form"><p className="eyebrow">WELCOME TO ACOURSE</p><h2>Good to see you.</h2><p className="muted">Sign in to explore your learning space.</p><form onSubmit={submit}><label>Username or email<input name="login" autoComplete="username" placeholder="Enter your username or email" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required maxLength={128}/></label><Notice error>{error}</Notice><button className="primary wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in →'}</button></form><p className="login-note">One space for students and teachers.</p></div></section></main>;
}
function Shell({ children }) {
  const { user, logout } = useContext(UserContext);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  return <><header><Link className="brand" to="/">a<span>course</span></Link><nav aria-label="Main navigation"><Link to="/">{user.role === 'Teacher' ? 'My teaching' : 'Discover courses'}</Link>{user.role === 'Student' && <Link to="/enrolled">My learning</Link>}</nav><div className="account"><span className="avatar">{user.username[0].toUpperCase()}</span><div><strong>{user.username}</strong><small>{user.role}</small></div><button className="text-button" disabled={busy} onClick={async () => { setBusy(true); try { await logout(); } catch (err) { setError(err.message); } finally { setBusy(false); } }}>Sign out</button></div></header><div className="page"><Notice error>{error}</Notice>{children}</div><footer><span>acourse · A space to keep growing.</span><span>Make room for something new ↗</span></footer></>;
}
function Catalog({ enrolled = false }) {
  const { user, api } = useContext(UserContext);
  const [courses, setCourses] = useState([]), [search, setSearch] = useState(''), [status, setStatus] = useState('All'), [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    api('/course' + (enrolled ? '?enrolled=true' : '')).then(data => { if (active) setCourses(data.courses); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api, enrolled, retry]);
  const teacher = user.role === 'Teacher';
  const visible = courses.filter(c => (c.name + ' ' + c.teacherName).toLowerCase().includes(search.toLowerCase()) && (status === 'All' || c.status === status));
  return <><section className="intro"><div><p className="eyebrow">{teacher ? 'YOUR TEACHING SPACE' : enrolled ? 'YOUR LEARNING SPACE' : 'STAY CURIOUS. KEEP GROWING.'}</p><h1>{teacher ? 'Share what you know.' : enrolled ? 'Keep the momentum.' : 'What will you learn next?'}</h1><p>{teacher ? 'Create meaningful courses. Help your students take their next step.' : enrolled ? 'Your next chapter is already in progress. Pick up where you left off.' : 'Practical skills, fresh perspectives, and a little inspiration for what’s next.'}</p></div>{teacher ? <Link className="primary" to="/new">＋ Create a course</Link> : <div className="intro-mark" aria-hidden="true">↗<small>GROW AT YOUR PACE</small></div>}</section><section className="stats" aria-label="Course overview"><div><strong>{courses.length}</strong><span>{teacher ? 'Your courses' : enrolled ? 'Enrolled courses' : 'Courses to explore'}</span></div><div><strong>{courses.filter(c => c.status === 'Open').length}</strong><span>Open courses</span></div><div><strong>{teacher ? courses.reduce((sum, c) => sum + c.enrolledCount, 0) : courses.filter(c => c.enrolled).length}</strong><span>{teacher ? 'Total enrollments' : 'Your enrollments'}</span></div><p>Small steps.<br/><b>Lasting possibilities.</b></p></section><section><div className="section-heading"><div><p className="eyebrow">INVEST IN YOURSELF</p><h2>{teacher ? 'Your courses' : enrolled ? 'Your course collection' : 'Explore the collection'}<span className="count">{visible.length}</span></h2></div><label className="search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search by course or teacher" placeholder="Search course or teacher…" value={search} onChange={e => setSearch(e.target.value)}/></label></div><div className="filters">{['All', 'Open', 'Close', ...(teacher ? ['Cancel'] : [])].map(s => <button key={s} aria-pressed={status === s} className={status === s ? 'selected' : ''} onClick={() => setStatus(s)}>{s === 'All' ? 'All courses' : s === 'Close' ? 'Closed' : s === 'Cancel' ? 'Canceled' : 'Open for enrollment'}</button>)}</div><Notice error>{error}</Notice>{error && <button onClick={() => setRetry(n => n + 1)}>Try again</button>}{loading ? <p role="status" className="empty">Finding your courses…</p> : !error && (visible.length ? <div className="course-grid">{visible.map((c, i) => <article key={c._id} className="course-card"><div className={'course-art art-' + i % 4}><div className="art-symbol" aria-hidden="true">{['↗', '✳', '◒', '⌘'][i % 4]}</div><span className="art-topic">{c.topics[0]}</span><Badge status={c.status}/></div><div className="card-content"><p className="course-teacher">{c.teacherName} <span>· {c.duration} days</span></p><h3><Link to={'/course/' + c._id}>{c.name}</Link></h3><div className="topics">{c.topics.slice(0, 3).map(t => <span key={t}>{t}</span>)}{c.topics.length > 3 && <span>+{c.topics.length - 3}</span>}</div><div className="seats"><span>{c.enrolledCount} / {c.maxStudent} students</span><span>{c.enrolled ? '✓ Enrolled' : c.seatsRemaining === 0 ? 'Full' : c.seatsRemaining + ' seats left'}</span></div><div className="meter"><span style={{ width: Math.min(100, c.enrolledCount / c.maxStudent * 100) + '%' }}/></div><div className="card-bottom"><strong>{c.price === 0 ? 'Free' : money(c.price)}</strong><Link to={'/course/' + c._id}>{teacher ? 'Manage course' : 'View course'} ↗</Link></div></div></article>)}</div> : <div className="empty"><h3>{enrolled ? 'Your learning starts with one course.' : 'No courses found.'}</h3><p>{search ? 'Try another course name or teacher.' : teacher ? 'Create your first course to get started.' : 'Explore the collection to find your next step.'}</p>{enrolled && <Link to="/">Discover courses →</Link>}</div>)}</section></>;
}
function Detail() {
  const { courseId } = useParams(), { user, api } = useContext(UserContext);
  const [course, setCourse] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { let active = true; api('/course/' + courseId).then(d => { if (active) setCourse(d.course); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [api, courseId]);
  const teacher = user.role === 'Teacher';
  async function act(action) {
    setBusy(true); setError(''); setMessage('');
    try {
      if (action === 'delete') { await api('/course/' + courseId, { method: 'DELETE' }); navigate('/'); }
      else { const d = await api('/course/' + courseId + '/enroll', { method: 'POST' }); setCourse(d.course); setMessage(d.message); }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <><Link className="back" to="/">← Back to courses</Link><Notice error>{error}</Notice><Notice>{message}</Notice>{!course ? !error && <p role="status">Loading course…</p> : <><section className="detail-heading"><p className="eyebrow">A NEW POSSIBILITY</p><Badge status={course.status}/><h1>{course.name}</h1><p className="muted">Taught by <strong>{course.teacherName}</strong></p></section><div className="detail-grid"><section className="panel"><h2>What you’ll explore</h2><div className="topic-list">{course.topics.map((t, i) => <div key={t}><span>{String(i + 1).padStart(2, '0')}</span><h3>{t}</h3><span>↗</span></div>)}</div>{teacher && <><h2 className="roster-heading">Enrolled students <span className="count">{course.enrolledCount}</span></h2>{course.students?.length ? <div className="roster">{course.students.map(s => <div key={s._id}><strong>{s.username}</strong><span>{s.email}</span></div>)}</div> : <p className="muted">No students have enrolled yet.</p>}</>}</section><aside className="panel enrollment"><p className="eyebrow">MAKE YOUR NEXT MOVE</p><h2>{course.price === 0 ? 'Free' : money(course.price)}</h2><dl><div><dt>Duration</dt><dd>{course.duration} days</dd></div><div><dt>Class capacity</dt><dd>{course.maxStudent} students</dd></div><div><dt>Enrolled</dt><dd>{course.enrolledCount} students</dd></div><div><dt>Seats remaining</dt><dd>{course.seatsRemaining}</dd></div></dl>{teacher ? <><Link className="primary wide" to={'/course/' + course._id + '/edit'}>Edit course →</Link><button className="danger wide" disabled={busy || course.enrolledCount > 0} onClick={() => setConfirm(true)}>Delete course</button>{course.enrolledCount > 0 && <p className="fine">Courses with enrolled students cannot be deleted.</p>}{confirm && <div className="confirm" role="alert"><p>Delete this course permanently?</p><button className="danger" disabled={busy} onClick={() => act('delete')}>Confirm deletion</button><button disabled={busy} onClick={() => setConfirm(false)}>Keep course</button></div>}</> : <><button className="primary wide" disabled={busy || course.enrolled || course.status !== 'Open' || course.seatsRemaining < 1} onClick={() => act('enroll')}>{busy ? 'Enrolling…' : course.enrolled ? '✓ You’re enrolled' : course.status !== 'Open' ? 'Enrollment closed' : course.seatsRemaining < 1 ? 'Course full' : 'Enroll in this course →'}</button><p className="fine">{course.enrolled ? 'Find this course in My learning.' : 'Take the next step in your learning journey.'}</p></>}</aside></div></>}</>;
}
const empty = { name: '', duration: 7, topics: '', price: 0, maxStudent: 20, status: 'Open' };
function CourseForm() {
  const { courseId } = useParams(), { api } = useContext(UserContext), navigate = useNavigate();
  const [form, setForm] = useState(empty), [ready, setReady] = useState(!courseId), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!courseId) return;
    let active = true;
    api('/course/' + courseId).then(({ course }) => { if (active) { setForm({ ...course, topics: course.topics.join('\n') }); setReady(true); } }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [api, courseId]);
  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const data = { ...form, duration: Number(form.duration), price: Number(form.price), maxStudent: Number(form.maxStudent), topics: form.topics.split('\n').map(t => t.trim()).filter(Boolean) };
      const d = await api('/course' + (courseId ? '/' + courseId : ''), { method: courseId ? 'PUT' : 'POST', body: JSON.stringify(data) });
      navigate('/course/' + d.course._id);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <><Link className="back" to={courseId ? '/course/' + courseId : '/'}>← Back</Link><p className="eyebrow">YOUR KNOWLEDGE, THEIR NEXT CHAPTER</p><h1>{courseId ? 'Refine your course.' : 'Create something worth learning.'}</h1><Notice error>{error}</Notice>{ready ? <form className="panel editor" onSubmit={submit}><label>Course name<input name="name" value={form.name} onChange={change} required maxLength={120} placeholder="e.g. Practical web development"/></label><label>Topics <small>One topic per line</small><textarea name="topics" rows={5} value={form.topics} onChange={change} required placeholder={'HTML & CSS\nReact fundamentals\nBuilding APIs'}/></label><div className="form-row"><label>Duration (days)<input name="duration" type="number" min="1" max="3650" step="1" value={form.duration} onChange={change} required/></label><label>Price (USD)<input name="price" type="number" min="0" max="1000000" step="0.01" value={form.price} onChange={change} required/></label><label>Maximum students<input name="maxStudent" type="number" min={form.enrolledCount || 1} max="10000" step="1" value={form.maxStudent} onChange={change} required/></label></div><label>Course status<select name="status" value={form.status} onChange={change}><option value="Open">Open — students may enroll while seats remain</option><option value="Close">Close — visible, enrollment unavailable</option><option value="Cancel">Cancel — hidden from students, enrollment unavailable</option></select></label><div className="form-actions"><Link to={courseId ? '/course/' + courseId : '/'}>Cancel</Link><button className="primary" disabled={busy}>{busy ? 'Saving…' : courseId ? 'Save changes →' : 'Create course →'}</button></div></form> : !error && <p role="status">Loading course…</p>}</>;
}
function AppRoutes() {
  const { user, ready } = useContext(UserContext);
  if (!ready) return <div className="empty" role="status">Opening your learning space…</div>;
  if (!user) return <Login/>;
  return <Shell><Routes><Route path="/" element={<Catalog/>}/><Route path="/enrolled" element={user.role === 'Student' ? <Catalog enrolled/> : <Navigate to="/" replace/>}/><Route path="/new" element={user.role === 'Teacher' ? <CourseForm key="new"/> : <Navigate to="/" replace/>}/><Route path="/course/:courseId" element={<Detail/>}/><Route path="/course/:courseId/edit" element={user.role === 'Teacher' ? <CourseForm key="edit"/> : <Navigate to="/" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Shell>;
}
export default function App() { return <HashRouter><AppRoutes/></HashRouter>; }
