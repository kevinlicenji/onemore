/**
 * @returns A short relative time label such as "3 giorni fa" / "3 days ago".
 */
export function formatRelativeDaysAgo(
  isoDate: string,
  locale: string,
  labels: { today: string; yesterday: string; daysAgo: (count: number) => string },
): string {
  const completed = new Date(isoDate);
  const now = new Date();
  const completedDay = Date.UTC(completed.getFullYear(), completed.getMonth(), completed.getDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today - completedDay) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) {
    return labels.today;
  }
  if (diffDays === 1) {
    return labels.yesterday;
  }
  return labels.daysAgo(diffDays);
}
