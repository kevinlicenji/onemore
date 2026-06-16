'use client';

import { cn } from '@onemore/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

interface CalendarDay {
  date: string;
  day: number;
  hasLog: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface SupplementCalendarProps {
  selectedDate: string;
  logDates: Set<string>;
  onSelectDate: (date: string) => void;
  locale: string;
  todayDateKey?: string;
}

function weekdayLabels(locale: string): string[] {
  if (locale === 'it') return ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
}

function buildMonthDays(
  year: number,
  month: number,
  logDates: Set<string>,
  selectedDate: string,
  todayDateKey: string,
): CalendarDay[] {
  const today = todayDateKey;
  const days: CalendarDay[] = [];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstWeekday = firstDay.getDay();
  const padStart = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const prevLastDay = new Date(year, month, 0).getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  for (let i = padStart; i > 0; i--) {
    const d = prevLastDay - i + 1;
    const dateStr = formatDate(prevYear, prevMonth + 1, d);
    days.push({
      date: dateStr,
      day: d,
      hasLog: logDates.has(dateStr),
      isCurrentMonth: false,
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate,
    });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = formatDate(year, month + 1, d);
    days.push({
      date: dateStr,
      day: d,
      hasLog: logDates.has(dateStr),
      isCurrentMonth: true,
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate,
    });
  }

  const remaining = 42 - days.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let d = 1; d <= remaining; d++) {
    const dateStr = formatDate(nextYear, nextMonth + 1, d);
    days.push({
      date: dateStr,
      day: d,
      hasLog: logDates.has(dateStr),
      isCurrentMonth: false,
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate,
    });
  }

  return days;
}

function formatDate(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthNames(locale: string): string[] {
  if (locale === 'it')
    return [
      'Gennaio',
      'Febbraio',
      'Marzo',
      'Aprile',
      'Maggio',
      'Giugno',
      'Luglio',
      'Agosto',
      'Settembre',
      'Ottobre',
      'Novembre',
      'Dicembre',
    ];
  return [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
}

export function SupplementCalendar({
  selectedDate,
  logDates,
  onSelectDate,
  locale,
  todayDateKey,
}: SupplementCalendarProps): React.ReactElement {
  const today = todayDateKey ?? new Date().toISOString().split('T')[0] ?? '';
  const selected = useMemo(() => new Date(selectedDate + 'T12:00:00.000Z'), [selectedDate]);
  const currentYear = selected.getFullYear();
  const currentMonth = selected.getMonth();

  const weeks = useMemo(() => {
    const days = buildMonthDays(currentYear, currentMonth, logDates, selectedDate, today);
    const result: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [currentYear, currentMonth, logDates, selectedDate, today]);

  function goMonth(delta: number): void {
    const d = new Date(currentYear, currentMonth + delta, 1);
    const dateStr = formatDate(d.getFullYear(), d.getMonth() + 1, 1);
    onSelectDate(dateStr);
  }

  const weekDays = weekdayLabels(locale).map((label, i) => (
    <div
      key={i}
      className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60"
    >
      {label}
    </div>
  ));

  const monthLabel = monthNames(locale)[currentMonth];

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <button
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors active:text-foreground"
          type="button"
          onClick={() => {
            goMonth(-1);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">
          {monthLabel} {currentYear}
        </span>
        <button
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors active:text-foreground"
          type="button"
          onClick={() => {
            goMonth(1);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {weekDays}
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const isSelectedOrToday = day.isSelected || day.isToday;
            return (
              <button
                key={String(wi) + '-' + String(di)}
                aria-label={day.date}
                aria-pressed={day.isSelected}
                className={cn(
                  'relative flex h-9 flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors',
                  day.isSelected
                    ? 'bg-primary text-primary-foreground'
                    : day.isToday
                      ? 'bg-primary/10 text-foreground'
                      : day.isCurrentMonth
                        ? 'text-foreground hover:bg-muted'
                        : 'text-muted-foreground/40',
                )}
                type="button"
                onClick={() => {
                  onSelectDate(day.date);
                }}
              >
                <span className={cn(isSelectedOrToday && 'font-bold')}>{day.day}</span>
                {day.hasLog && (
                  <span
                    className={cn(
                      'mt-0.5 h-1 w-1 rounded-full',
                      day.isSelected ? 'bg-primary-foreground' : 'bg-primary',
                    )}
                  />
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
