# Acourse — Online Course Service

Next.js API + React (Vite) frontend + MongoDB. Continued from [the provided starter](https://github.com/pop2518hotmailcom/wad-final-2026-01), preserving both application folders and the original API paths.

## Student information
- Student name: to be completed by the submitting student
- Student ID: to be completed by the submitting student

## Submission links
- Repository: https://github.com/lycrois29/acourse-final-2026
- Backend source: https://github.com/lycrois29/acourse-final-2026/tree/main/next-backend
- Frontend source: https://github.com/lycrois29/acourse-final-2026/tree/main/react-frontend
- Backend deployment: https://acourse-api-lyco.vercel.app
- Frontend deployment: https://acourse-web-lyco.vercel.app
- Screen/camera recording: the student must supply their own recording link. No recording was created by this project.

The repository is public; both source folders are accessible without signing in.

## Test accounts
All six accounts use password `LearnTogether!2026`. Run the seed script first.

| Role | Username | Email |
| --- | --- | --- |
| Teacher | teacher1 | teacher1@acourse.test |
| Teacher | teacher2 | teacher2@acourse.test |
| Teacher | teacher3 | teacher3@acourse.test |
| Student | student1 | student1@acourse.test |
| Student | student2 | student2@acourse.test |
| Student | student3 | student3@acourse.test |

Sign in with either username or email. Demo credentials are for evaluation data only.

## Quick temporary local demo
Requires Node.js 22.12+ (tested on Node 24), npm, and internet access for the initial MongoDB binary download.

1. In `react-frontend`, run `npm ci`.
2. In `next-backend`, run `npm ci`, then `npm run demo`.
3. Open **http://localhost:5173**.
4. The demo starts a real temporary MongoDB instance, seeds it, and runs both applications. Data resets when the demo process stops. Use this mode for testing only.

On a restricted workstation, direct npm's cache and MongoDB's binary download directory to a writable folder. `MONGOMS_DOWNLOAD_DIR` controls the latter.

## Persistent local setup
1. Provide a local MongoDB server or an Atlas connection URI.
2. In `next-backend`, copy `.env.example` to `.env.local`.
3. Set `MONGODB_URI`, `MONGODB_DB=course_service`, a random `JWT_SECRET` of at least 32 characters, and `FRONTEND_ORIGIN=http://localhost:5173`.
4. Run `npm ci`, `npm run seed`, then `npm run dev`.
5. In `react-frontend`, copy `.env.example` to `.env.local`; set `VITE_API_URL=http://localhost:3000` (base origin, without /api).
6. Run `npm ci`, then `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`.
7. Open **http://localhost:5173** so the browser origin matches the backend CORS setting.

Seeding inserts missing fixed demo users/courses and indexes without overwriting existing records or enrollments. Passwords are bcrypt hashes. It must be run against the same database used by the deployed backend.

## Testing walkthrough
1. Sign in as student3. See all non-canceled courses and search for a partial course name or teacher name.
2. Open Creative writing workshop. Enroll, verify the count changes, and see it in My learning. A second enrollment is rejected.
3. Open The foundations of photography: visible but closed to enrollment.
4. Open Build your first API: full; enrollment is unavailable. Canceled workshops do not appear and their detail/enrollment API returns 404 for students.
5. Sign out and sign in as teacher1. Only teacher1's courses appear.
6. Open Practical web development and review the enrolled student usernames/emails.
7. Create a course with all required fields and multiple topics; edit it; change its status to Open, Close, and Cancel.
8. Delete an empty course. Enrolled courses cannot be deleted, and capacity cannot be reduced below the current enrolled count.
9. Sign in as teacher2 and confirm teacher1's courses cannot be viewed, edited, or deleted.
10. Refresh while signed in to verify session restoration. Sign out to revoke the server session.

## Automated verification
Both applications have `npm run build`.

With the isolated temporary demo running, execute `npm run test:api` inside `next-backend`. It performs 51 checks against actual HTTP routes and MongoDB, covering:
- all six logins, username/email login, invalid credentials and malformed JSON;
- unauthenticated/forged tokens, student role restrictions, cross-teacher ownership;
- course creation, updates, details, rosters, privacy, search, and enrolled lists;
- Open/Close/Cancel behavior, duplicates, capacity, safe deletion, invalid IDs;
- simultaneous last-seat enrollment and repeated simultaneous enrollment by one student;
- profile access and session revocation on logout.

**Use an isolated test database**: these tests deliberately create enrolled fixtures that cannot be deleted through the normal API. Temporary demo data is discarded on process exit. Do not point TEST_API_URL at production.

## API
All routes except login require `Authorization: Bearer <token>`. Preflight OPTIONS requests are public. The JWT expires after eight hours; each protected handler verifies the persisted session and reads the user's current role from MongoDB. Logout revokes that session immediately. Tokens live in sessionStorage to survive refresh within a tab; the API uses no authentication cookies, avoiding cross-site cookie requirements.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | /api/auth/login | { login, password }; returns token and safe user |
| POST | /api/auth/logout | Revoke current session |
| GET | /api/user | Current user |
| GET | /api/user/:id | Own profile only |
| GET | /api/course?q=term&enrolled=true | Teacher's own courses or student's non-canceled catalog |
| POST | /api/course | Teacher creates course |
| GET | /api/course/:id | Authorized course detail; owner sees roster |
| PUT | /api/course/:id | Teacher owner updates complete course fields |
| DELETE | /api/course/:id | Teacher owner deletes only if no enrollments |
| POST | /api/course/:id/enroll | Student enrollment, subject to availability |

Course fields: `name`, `duration` (integer days), `topics` (array of strings), `price` (USD), `maxStudent` (positive integer), `status` (Open / Close / Cancel). Teacher identity and enrollments come from the server, never the submitted payload. Enrollment, status/capacity updates, and safe deletion use conditional atomic operations on the same course document. Students never receive another student's identity.

## Vercel deployment
Import this repository into **two separate Vercel projects**, with root directories:
- Backend: `next-backend`, Next.js framework, build `npm run build`.
- Frontend: `react-frontend`, Vite framework, build `npm run build`, output `dist`.

Backend environment variables (production and any preview environment you intend to test):
- `MONGODB_URI`: Atlas URI using the dedicated acourse_app user.
- `MONGODB_DB`: course_service.
- `JWT_SECRET`: a unique random value of at least 32 characters.
- `FRONTEND_ORIGIN`: exact production frontend origin, no trailing slash.

Frontend environment:
- `VITE_API_URL`: exact production backend origin, no trailing slash and no /api.

Use a dedicated Atlas user with readWrite on course_service only. Keep secrets in local ignored env files or Vercel environment settings. Allow the actual runtime network to reach Atlas according to your network policy. Seed once from a permitted machine. Frontend VITE variables are embedded at build time: redeploy after changing them.

Deployment order: backend with environment variables; frontend pointed to the returned backend URL; update backend FRONTEND_ORIGIN to the returned frontend URL; redeploy backend. Verify deployed login and enrollment through the frontend. HashRouter needs no SPA rewrite.

See [Vercel monorepos](https://vercel.com/docs/monorepos), [environment variables](https://vercel.com/docs/environment-variables), and [Atlas IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

## Completion notes
Verified: both production builds; 51 local API checks including concurrent enrollment; 31 live API smoke checks across all six accounts; live browser login and course catalog. Browser-reviewed local student search/detail, login/logout, and teacher roster/editing screens. Both Vercel deployments are Ready and the frontend successfully communicates with the backend. Submission identity and full screen/camera recording remain the student's responsibility.
