/** Today as YYYY-MM-DD (local time), for <input type="date" min/max>. */
export function todayISO() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
