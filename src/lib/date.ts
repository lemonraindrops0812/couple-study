/** Get logical "today" date string (YYYY-MM-DD). Day starts at 2:00 AM. */
export function getToday(): string {
  const now = new Date()
  if (now.getHours() < 2) now.setDate(now.getDate() - 1)
  return now.toISOString().split('T')[0]
}
