/** Advent calendar: public in December; outside December, admins only. */
export function isAdventSeason(now: Date = new Date()): boolean {
  return now.getMonth() === 11;
}

export function canAccessAdventCalendar(user?: {
  role?: string;
  isAdmin?: boolean;
} | null): boolean {
  if (isAdventSeason()) return true;
  return user?.role === 'admin' || user?.isAdmin === true;
}
