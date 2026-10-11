/** "1:05" for 65 seconds; partial seconds round up so the clock reaches 0:00 only at the end. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
