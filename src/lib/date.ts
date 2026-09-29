/** Format a local calendar date as YYYY-MM-DD without converting it to UTC. */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * The dashboard's day starts at 2:00 AM.  Keep this in local time: using
 * Date#toISOString would otherwise move China-local dates back one day before
 * 08:00 and make records appear to disappear.
 */
export function getLogicalDate(now = new Date()): Date {
  const date = new Date(now)
  if (date.getHours() < 2) date.setDate(date.getDate() - 1)
  return date
}

/** Get the logical "today" key (YYYY-MM-DD). */
export function getToday(now = new Date()): string {
  return formatDateKey(getLogicalDate(now))
}

/** Get a logical calendar-day key relative to the current study day. */
export function getDateOffset(offset: number, now = new Date()): string {
  const date = getLogicalDate(now)
  date.setDate(date.getDate() + offset)
  return formatDateKey(date)
}

/** Move a stored YYYY-MM-DD key by whole calendar days in local time. */
export function shiftDateKey(dateKey: string, offset: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + offset)
  return formatDateKey(date)
}

/** Monday is the first day of a study week. */
export function getWeekStart(now = new Date()): string {
  const date = getLogicalDate(now)
  const daysSinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - daysSinceMonday)
  return formatDateKey(date)
}
