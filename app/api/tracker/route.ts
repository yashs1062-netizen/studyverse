import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { validTracker } from '../../../lib/tracker-validation';
export const dynamic = 'force-dynamic';
const json = (v: unknown, status = 200) => Response.json(v, { status, headers: { 'Cache-Control': 'no-store, private' } });
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Sign in to load your tracker.' }, 401);
  try {
    const row = await env.DB!.prepare('SELECT data, revision, updated_at FROM trackers WHERE user_id = ?').bind(user.userId).first<{data:string; revision:number; updated_at:string}>();
    return json({ userId: user.userId, state: row ? JSON.parse(row.data) : null, revision: row?.revision || 0, updatedAt: row?.updated_at || null });
  } catch { return json({ error: 'Could not load your saved tracker. Please retry.' }, 503); }
}
export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Sign in to save your tracker.' }, 401);
  if (request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('X-Studyverse-Request') !== '1') return json({ error: 'Invalid request origin.' }, 403);
  if (!request.headers.get('Content-Type')?.includes('application/json')) return json({ error: 'Expected JSON.' }, 415);
  let body: any;
  try {
    if (Number(request.headers.get('Content-Length')) > 4500000) return json({error:'Tracker is too large. Export a backup.'},413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 4500000) return json({error:'Tracker is too large. Export a backup.'},413);
    body = JSON.parse(raw);
  } catch { return json({ error: 'Invalid JSON.' }, 400); }
  if (!validTracker(body?.state) || !Number.isSafeInteger(body?.revision) || body.revision < 0) return json({ error: 'Invalid tracker data.' }, 400);
  try {
    const now = new Date().toISOString(), data = JSON.stringify(body.state);
    const result = body.revision === 0
      ? await env.DB!.prepare('INSERT INTO trackers (user_id, data, revision, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO NOTHING').bind(user.userId, data, now).run()
      : await env.DB!.prepare('UPDATE trackers SET data = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ?').bind(data, now, user.userId, body.revision).run();
    if (!result.meta.changes) return json({ error: 'Your tracker changed on another device. Choose which version to keep.' }, 409);
    return json({ revision: body.revision + 1, updatedAt: now });
  } catch { return json({ error: 'Could not save. Your changes remain on this device.' }, 503); }
}
