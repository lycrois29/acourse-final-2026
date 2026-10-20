import { requireUser, verifyJWT } from '@/lib/auth';
import { database } from '@/lib/mongodb';
import { endpoint, ok } from '@/lib/api';
export const POST = endpoint(async req => {
  await requireUser(req);
  await (await database()).collection('sessions').deleteOne({ _id: verifyJWT(req).jti });
  return ok({ message: 'Signed out' }, 200);
});
