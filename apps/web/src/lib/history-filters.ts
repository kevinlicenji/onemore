export type HistoryDatePreset = 'all' | '7d' | '30d' | '90d' | 'custom';

export interface HistoryDateRange {
  from?: string;
  to?: string;
}

/**
 * Build ISO date range filters for the history API from a preset or custom dates.
 *
 * @param preset - Quick range selector.
 * @param customFrom - Local date input value (YYYY-MM-DD).
 * @param customTo - Local date input value (YYYY-MM-DD).
 */
export function buildHistoryDateRange(
  preset: HistoryDatePreset,
  customFrom?: string,
  customTo?: string,
): HistoryDateRange {
  if (preset === 'all') {
    return {};
  }

  if (preset === 'custom') {
    return {
      ...(customFrom ? { from: startOfDayIso(customFrom) } : {}),
      ...(customTo ? { to: endOfDayIso(customTo) } : {}),
    };
  }

  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function startOfDayIso(dateInput: string): string {
  return `${dateInput}T00:00:00.000Z`;
}

function endOfDayIso(dateInput: string): string {
  return `${dateInput}T23:59:59.999Z`;
}
