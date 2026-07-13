export function monthBounds(reference = new Date(), offsetMonths = 0) {
  const year = reference.getFullYear();
  const month = reference.getMonth() + offsetMonths;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function isDateInRange(value: Date | null | undefined, start: Date, end: Date) {
  if (!value) return false;
  return value >= start && value <= end;
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatMonthOverMonthChange(current: number, previous: number) {
  const change = percentChange(current, previous);
  const rounded = Math.round(change * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return {
    label: `${sign}${rounded}%`,
    tone: rounded > 0 ? ("up" as const) : rounded < 0 ? ("down" as const) : ("flat" as const)
  };
}
