/** Cloudflare scheduled handler: hit giveaways auto-enroll (was Vercel cron). */
export default {
  async scheduled(_controller: unknown, env: { PUBLIC_SITE_URL?: string }, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    const base = env.PUBLIC_SITE_URL || 'https://www.true-farming.com';
    ctx.waitUntil(
      fetch(`${base}/api/giveaways/auto-enroll-patreons`, { method: 'POST' }).catch((err) =>
        console.error('cron auto-enroll failed', err)
      )
    );
  },
};
