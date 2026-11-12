import { randomUUID } from 'node:crypto';
import { readJson, reply } from './security';

function subscriptionValue(value: any) {
  try {
    const url = new URL(value?.endpoint);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443') || url.href.length > 4096
      || !['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'].includes(url.hostname)) return null;
    const { p256dh, auth } = value.keys || {};
    if (typeof p256dh !== 'string' || typeof auth !== 'string' || !/^[\w-]+$/.test(p256dh) || !/^[\w-]+$/.test(auth)
      || Buffer.from(p256dh, 'base64url').length !== 65 || Buffer.from(auth, 'base64url').length !== 16) return null;
    return { endpoint: url.href, keys: { p256dh, auth } };
  } catch { return null; }
}

export async function handlePushSubscription(req: any, res: any, actor: any) {
  if (req.method === 'GET') {
    const result = await actor.client.from('push_subscriptions').select('id').eq('user_id', actor.profile.id).eq('session_id', actor.session.id).limit(1);
    if (result.error) throw result.error;
    return reply(res, 200, { enabled: !!result.data?.length });
  }
  const body = await readJson(req, 10000);
  if (req.method === 'DELETE') {
    const result = await actor.client.from('push_subscriptions').delete().eq('user_id', actor.profile.id).eq('session_id', actor.session.id).eq('endpoint', String(body.endpoint || ''));
    if (result.error) throw result.error;
    return reply(res, 200, { success: true });
  }
  if (req.method !== 'POST') return reply(res, 405, { error: 'method_not_allowed' });
  const subscription = subscriptionValue(body.subscription);
  if (!subscription) return reply(res, 400, { error: 'invalid_push_subscription' });
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return reply(res, 503, { error: 'push_not_configured' });
  const existing = await actor.client.from('push_subscriptions').select('*').eq('endpoint', subscription.endpoint).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data && existing.data.user_id !== actor.profile.id && (existing.data.keys?.auth !== subscription.keys.auth || existing.data.keys?.p256dh !== subscription.keys.p256dh)) return reply(res, 403, { error: 'subscription_ownership_required' });
  const result = await actor.client.from('push_subscriptions').upsert({ id: existing.data?.id || randomUUID(), user_id: actor.profile.id,
    session_id: actor.session.id, ...subscription, language: body.language === 'EN' ? 'EN' : 'FR' }, { onConflict: 'endpoint' });
  if (result.error) throw result.error;
  return reply(res, 200, { success: true });
}

export async function dispatchPush(client: any) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return { configured: false, sent: 0 };
  let sent = 0;
  try {
    await client.from('push_jobs').update({ status: 'failed', next_attempt_at: new Date().toISOString() }).eq('status', 'sending').lt('updated_at', new Date(Date.now() - 300000).toISOString());
    const jobs = await client.from('push_jobs').select('*').in('status', ['pending', 'failed']).lte('next_attempt_at', new Date().toISOString()).lt('attempts', 5).limit(10);
    if (jobs.error) return { configured: true, sent, retryPending: true };
    const webpush = await import('web-push');
    await Promise.all((jobs.data || []).map(async (job: any) => {
      const claim = await client.from('push_jobs').update({ status: 'sending', attempts: job.attempts + 1, updated_at: new Date().toISOString() })
        .eq('notification_id', job.notification_id).eq('status', job.status).eq('attempts', job.attempts).select('notification_id').maybeSingle();
      if (claim.error || !claim.data) return;
      let failed = false;
      let delivered = false;
      try {
        const notice = await client.from('notifications').select('id,user_id,read_at').eq('id', job.notification_id).maybeSingle();
        if (notice.error) throw notice.error;
        if (notice.data && !notice.data.read_at) {
          const subscriptions = await client.from('push_subscriptions').select('*').eq('user_id', notice.data.user_id).limit(10);
          if (subscriptions.error) throw subscriptions.error;
          for (const subscription of subscriptions.data || []) {
            const session = await client.from('web_sessions').select('id').eq('id', subscription.session_id).eq('user_id', subscription.user_id).gt('expires_at', new Date().toISOString()).maybeSingle();
            if (session.error) throw session.error;
            if (!session.data || !subscriptionValue(subscription)) continue;
            try {
              const details = webpush.generateRequestDetails(subscription, JSON.stringify({ userId: notice.data.user_id, notificationId: notice.data.id, language: subscription.language }), {
                TTL: 3600, urgency: 'normal', vapidDetails: { subject: process.env.VAPID_SUBJECT || 'mailto:stevenbmj202@gmail.com', publicKey: process.env.VAPID_PUBLIC_KEY!, privateKey: process.env.VAPID_PRIVATE_KEY! },
              });
              const response = await fetch(details.endpoint, { method: details.method, headers: details.headers as any, body: details.body as any, signal: AbortSignal.timeout(2500), redirect: 'error' });
              if (response.status === 404 || response.status === 410) {
                await client.from('push_subscriptions').delete().eq('id', subscription.id);
              } else if (!response.ok) failed = true;
              else { delivered = true; sent++; }
            } catch { failed = true; }
          }
        }
      } catch { failed = true; }
      await client.from('push_jobs').update({ status: failed ? 'failed' : delivered ? 'sent' : 'unsubscribed',
        next_attempt_at: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** job.attempts)).toISOString(), updated_at: new Date().toISOString() }).eq('notification_id', job.notification_id);
    }));
    return { configured: true, sent };
  } catch { return { configured: true, sent, retryPending: true }; }
}

export async function queuePush(client: any) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  const task = dispatchPush(client);
  if (process.env.VERCEL === '1') {
    const { waitUntil } = await import('@vercel/functions');
    waitUntil(task);
  } else void task.catch(() => null);
}
