import { requireUser } from '@/lib/auth';
import { endpoint, fail, ok } from '@/lib/api';
export const GET = endpoint(async (req, context) => {
  const user = await requireUser(req);
  if ((await context.params).user_id !== String(user._id)) fail('You may only view your own profile', 403);
  return ok({ user }, 200);
});
