/**
 * Timezone-safe Asia/Bangkok date and time formatters.
 * Uses hourCycle: 'h23' to guarantee 24-hour time without midnight being rendered as 24:xx.
 */

/**
 * Formats ISO timestamp to Asia/Bangkok time (HH:mm น.) gracefully.
 * Returns null if string is empty, null, or invalid.
 */
export function formatBangkokTime(isoString?: string | null): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d);
}

/**
 * Formats ISO timestamp to Asia/Bangkok date and time (d MMM HH:mm น.) gracefully.
 * Returns null if string is empty, null, or invalid.
 */
export function formatBangkokDateTime(isoString?: string | null): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d);
}
