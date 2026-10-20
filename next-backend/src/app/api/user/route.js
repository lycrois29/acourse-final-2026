import { requireUser } from '@/lib/auth';
import { endpoint, ok } from '@/lib/api';
export const GET = endpoint(async req => ok({ user: await requireUser(req) }, 200));
