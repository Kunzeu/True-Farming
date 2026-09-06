function parseList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

/** Usernames with full admin access (comma-separated). Defaults to site owner. */
export function getSiteAdminUsernames(): string[] {
  const fromEnv = parseList(process.env.ADMIN_USERNAMES);
  if (fromEnv.length > 0) return fromEnv;
  return ['kunzeu'];
}

/** Emails with full admin access (comma-separated). */
export function getSiteAdminEmails(): string[] {
  return parseList(process.env.ADMIN_EMAILS);
}

export function isSiteAdminIdentity(email?: string | null, username?: string | null): boolean {
  const emails = getSiteAdminEmails();
  const usernames = getSiteAdminUsernames();
  if (email && emails.includes(email.trim().toLowerCase())) return true;
  if (username && usernames.includes(username.trim().toLowerCase())) return true;
  return false;
}

export function resolveEffectiveRole(
  dbRole: string,
  email?: string | null,
  username?: string | null,
): 'admin' | 'moderator' | 'user' {
  if (isSiteAdminIdentity(email, username)) return 'admin';
  if (dbRole === 'admin' || dbRole === 'moderator' || dbRole === 'user') {
    return dbRole;
  }
  return 'user';
}
