/** Local-calendar day keys (YYYY-MM-DD), validated: real dates only. */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const isDay = (k: unknown): k is string => {
  if (typeof k !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(k)) return false;
  const [y, m, d] = k.split('-').map(Number); if (y < 2020 || y > 2100) return false;
  return dayKey(new Date(y, m - 1, d)) === k;
};
export const addDays = (k: string, n: number) => { const [y, m, d] = k.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n)); };
