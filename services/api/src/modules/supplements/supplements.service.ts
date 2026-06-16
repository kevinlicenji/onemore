import type {
  CreateSupplementInput,
  CreateSupplementLogInput,
  SupplementDetail,
  SupplementListItem,
  SupplementLogItem,
  SupplementLogListResponse,
  SupplementTrendItem,
  TodaySupplementsResponse,
  UpdateSupplementInput,
  UpdateSupplementLogInput,
} from '@onemore/shared';
import type { PrismaClient, Prisma } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';

type SupplementName = { it: string; en: string };

function dateString(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

/**
 * Normalize supplement log dates to UTC midnight for deduplication.
 */
function normalizeSupplementLogDate(isoDate: string): Date {
  const day = isoDate.split('T')[0] ?? isoDate;
  return new Date(`${day}T00:00:00.000Z`);
}

const activeSupplementFilter = (userId: string): Prisma.SupplementWhereInput => ({
  deletedAt: null,
  OR: [{ userId: null }, { userId }],
});

export class SupplementsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(userId: string, locale: string): Promise<SupplementListItem[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentCounts, allLogged, supplements] = await Promise.all([
      this.prisma.supplementLog.groupBy({
        by: ['supplementId'],
        where: { userId, date: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      this.prisma.supplementLog.groupBy({
        by: ['supplementId'],
        where: { userId },
        _count: true,
      }),
      this.prisma.supplement.findMany({
        where: activeSupplementFilter(userId),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const countMap = new Map(recentCounts.map((r) => [r.supplementId, r._count]));
    const everLoggedSet = new Set(allLogged.map((r) => r.supplementId));

    return supplements.map((s) => ({
      id: s.id,
      name: flattenName(s.name as SupplementName, locale),
      brand: s.brand,
      unit: s.unit,
      isGlobal: s.userId === null,
      calories: s.calories,
      protein: s.protein,
      carbs: s.carbs,
      fat: s.fat,
      recentLogCount: countMap.get(s.id) ?? 0,
      everLogged: everLoggedSet.has(s.id),
    }));
  }

  async getById(userId: string, supplementId: string, locale: string): Promise<SupplementDetail> {
    const supplement = await this.prisma.supplement.findFirst({
      where: {
        id: supplementId,
        ...activeSupplementFilter(userId),
      },
    });

    if (!supplement) {
      throw new HttpError(404, 'Supplement not found', 'SUPPLEMENT_NOT_FOUND');
    }

    return {
      id: supplement.id,
      name: flattenName(supplement.name as SupplementName, locale),
      brand: supplement.brand,
      unit: supplement.unit,
      isGlobal: supplement.userId === null,
      calories: supplement.calories,
      protein: supplement.protein,
      carbs: supplement.carbs,
      fat: supplement.fat,
      createdAt: supplement.createdAt.toISOString(),
      updatedAt: supplement.updatedAt.toISOString(),
    };
  }

  async create(
    userId: string,
    input: CreateSupplementInput,
    locale?: string,
  ): Promise<SupplementDetail> {
    const supplement = await this.prisma.supplement.create({
      data: {
        name: input.name,
        brand: input.brand ?? null,
        unit: input.unit,
        userId,
        calories: input.calories,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
      },
    });

    return {
      id: supplement.id,
      name: flattenName(supplement.name as SupplementName, locale ?? 'en'),
      brand: supplement.brand,
      unit: supplement.unit,
      isGlobal: false,
      calories: supplement.calories,
      protein: supplement.protein,
      carbs: supplement.carbs,
      fat: supplement.fat,
      createdAt: supplement.createdAt.toISOString(),
      updatedAt: supplement.updatedAt.toISOString(),
    };
  }

  async update(
    userId: string,
    supplementId: string,
    input: UpdateSupplementInput,
    locale: string,
  ): Promise<SupplementDetail> {
    const existing = await this.prisma.supplement.findFirst({
      where: { id: supplementId, deletedAt: null },
    });

    if (!existing) {
      throw new HttpError(404, 'Supplement not found', 'SUPPLEMENT_NOT_FOUND');
    }

    if (existing.userId === null) {
      const cloned = await this.prisma.supplement.create({
        data: {
          name: input.name ?? (existing.name as SupplementName),
          brand: input.brand !== undefined ? input.brand : existing.brand,
          unit: input.unit ?? existing.unit,
          userId,
          calories: input.calories ?? existing.calories,
          protein: input.protein ?? existing.protein,
          carbs: input.carbs ?? existing.carbs,
          fat: input.fat ?? existing.fat,
        },
      });

      return {
        id: cloned.id,
        name: flattenName(cloned.name as SupplementName, locale),
        brand: cloned.brand,
        unit: cloned.unit,
        isGlobal: false,
        calories: cloned.calories,
        protein: cloned.protein,
        carbs: cloned.carbs,
        fat: cloned.fat,
        createdAt: cloned.createdAt.toISOString(),
        updatedAt: cloned.updatedAt.toISOString(),
      };
    }

    if (existing.userId !== userId) {
      throw new HttpError(404, 'Supplement not found', 'SUPPLEMENT_NOT_FOUND');
    }

    const updated = await this.prisma.supplement.update({
      where: { id: supplementId },
      data: {
        name: input.name,
        brand: input.brand,
        unit: input.unit,
        calories: input.calories,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
      },
    });

    return {
      id: updated.id,
      name: flattenName(updated.name as SupplementName, locale),
      brand: updated.brand,
      unit: updated.unit,
      isGlobal: false,
      calories: updated.calories,
      protein: updated.protein,
      carbs: updated.carbs,
      fat: updated.fat,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async delete(userId: string, supplementId: string): Promise<void> {
    const existing = await this.prisma.supplement.findUnique({
      where: { id: supplementId },
    });

    if (!existing || existing.userId !== userId || existing.deletedAt !== null) {
      throw new HttpError(404, 'Supplement not found', 'SUPPLEMENT_NOT_FOUND');
    }

    await this.prisma.supplement.delete({ where: { id: supplementId } });
  }

  async listLogs(
    userId: string,
    query: {
      from?: string;
      to?: string;
      supplementId?: string;
      limit: number;
      cursor?: string;
    },
    locale: string,
  ): Promise<SupplementLogListResponse> {
    const dateFilter: Prisma.DateTimeFilter<'SupplementLog'> = {};
    if (query.from) dateFilter.gte = new Date(query.from);
    if (query.to) dateFilter.lte = new Date(query.to);
    if (query.cursor) dateFilter.lt = new Date(query.cursor);

    const where: Prisma.SupplementLogWhereInput = {
      userId,
      ...(query.supplementId ? { supplementId: query.supplementId } : {}),
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    };

    const logs = await this.prisma.supplementLog.findMany({
      where,
      orderBy: { date: 'desc' },
      take: query.limit + 1,
      include: {
        supplement: { select: { name: true, unit: true } },
      },
    });

    const hasMore = logs.length > query.limit;
    const trimmed = hasMore ? logs.slice(0, -1) : logs;

    return {
      logs: trimmed.map((log) => ({
        id: log.id,
        supplementId: log.supplementId,
        supplementName: flattenName(log.supplement.name as SupplementName, locale),
        supplementUnit: log.supplement.unit,
        amount: log.amount,
        notes: log.notes,
        date: log.date.toISOString(),
        createdAt: log.createdAt.toISOString(),
      })),
      nextCursor:
        hasMore && trimmed.length > 0 ? (trimmed.at(-1)?.date.toISOString() ?? null) : null,
    };
  }

  async createLog(
    userId: string,
    input: CreateSupplementLogInput,
    locale: string,
  ): Promise<SupplementLogItem> {
    const supplement = await this.prisma.supplement.findFirst({
      where: {
        id: input.supplementId,
        ...activeSupplementFilter(userId),
      },
    });

    if (!supplement) {
      throw new HttpError(404, 'Supplement not found', 'SUPPLEMENT_NOT_FOUND');
    }

    const logDate = normalizeSupplementLogDate(input.date);
    const existingLog = await this.prisma.supplementLog.findFirst({
      where: {
        userId,
        supplementId: input.supplementId,
        date: logDate,
      },
    });

    const log = existingLog
      ? await this.prisma.supplementLog.update({
          where: { id: existingLog.id },
          data: {
            amount: input.amount,
            notes: input.notes ?? null,
          },
          include: {
            supplement: { select: { name: true, unit: true } },
          },
        })
      : await this.prisma.supplementLog.create({
          data: {
            userId,
            supplementId: input.supplementId,
            amount: input.amount,
            notes: input.notes ?? null,
            date: logDate,
          },
          include: {
            supplement: { select: { name: true, unit: true } },
          },
        });

    return {
      id: log.id,
      supplementId: log.supplementId,
      supplementName: flattenName(log.supplement.name as SupplementName, locale),
      supplementUnit: log.supplement.unit,
      amount: log.amount,
      notes: log.notes,
      date: log.date.toISOString(),
      createdAt: log.createdAt.toISOString(),
    };
  }

  async updateLog(
    userId: string,
    input: UpdateSupplementLogInput,
    locale: string,
  ): Promise<SupplementLogItem> {
    const existing = await this.prisma.supplementLog.findUnique({
      where: { id: input.id },
    });

    if (!existing || existing.userId !== userId) {
      throw new HttpError(404, 'Supplement log not found', 'LOG_NOT_FOUND');
    }

    const log = await this.prisma.supplementLog.update({
      where: { id: input.id },
      data: {
        amount: input.amount,
        notes: input.notes,
        date: input.date ? normalizeSupplementLogDate(input.date) : undefined,
      },
      include: {
        supplement: { select: { name: true, unit: true } },
      },
    });

    return {
      id: log.id,
      supplementId: log.supplementId,
      supplementName: flattenName(log.supplement.name as SupplementName, locale),
      supplementUnit: log.supplement.unit,
      amount: log.amount,
      notes: log.notes,
      date: log.date.toISOString(),
      createdAt: log.createdAt.toISOString(),
    };
  }

  async deleteLog(userId: string, logId: string): Promise<void> {
    const existing = await this.prisma.supplementLog.findUnique({
      where: { id: logId },
    });

    if (!existing || existing.userId !== userId) {
      throw new HttpError(404, 'Supplement log not found', 'LOG_NOT_FOUND');
    }

    await this.prisma.supplementLog.delete({ where: { id: logId } });
  }

  async repeatYesterday(
    userId: string,
    date: string,
    locale: string,
  ): Promise<TodaySupplementsResponse> {
    const today = new Date(date);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayStart = dateString(yesterday) + 'T00:00:00.000Z';
    const todayStart = dateString(today) + 'T00:00:00.000Z';

    const yesterdayLogs = await this.prisma.supplementLog.findMany({
      where: {
        userId,
        date: {
          gte: new Date(yesterdayStart),
          lt: new Date(todayStart),
        },
      },
      include: {
        supplement: { select: { name: true, unit: true } },
      },
    });

    const dayStart = normalizeSupplementLogDate(todayStart);

    const existingToday = await this.prisma.supplementLog.findMany({
      where: {
        userId,
        date: dayStart,
      },
      select: { supplementId: true },
    });
    const existingSupplementIds = new Set(existingToday.map((log) => log.supplementId));

    const createdLogs = [];
    for (const log of yesterdayLogs) {
      if (existingSupplementIds.has(log.supplementId)) {
        continue;
      }

      const newLog = await this.prisma.supplementLog.create({
        data: {
          userId,
          supplementId: log.supplementId,
          amount: log.amount,
          notes: log.notes,
          date: dayStart,
        },
        include: {
          supplement: { select: { name: true, unit: true } },
        },
      });
      createdLogs.push(newLog);
      existingSupplementIds.add(log.supplementId);
    }

    const allTodayLogs = await this.prisma.supplementLog.findMany({
      where: {
        userId,
        date: dayStart,
      },
      include: {
        supplement: { select: { name: true, unit: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      date: date.split('T')[0] ?? '',
      logs: allTodayLogs.map((log) => ({
        id: log.id,
        supplementId: log.supplementId,
        supplementName: flattenName(log.supplement.name as SupplementName, locale),
        supplementUnit: log.supplement.unit,
        amount: log.amount,
        notes: log.notes,
        date: log.date.toISOString(),
        createdAt: log.createdAt.toISOString(),
      })),
      totalCount: allTodayLogs.length,
    };
  }

  async getTrend(userId: string, days: number, locale: string): Promise<SupplementTrendItem[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const startStr = dateString(startDate) + 'T00:00:00.000Z';
    const endStr = dateString(endDate) + 'T23:59:59.999Z';

    const logs = await this.prisma.supplementLog.findMany({
      where: {
        userId,
        date: {
          gte: new Date(startStr),
          lte: new Date(endStr),
        },
      },
      include: {
        supplement: { select: { name: true, unit: true } },
      },
      orderBy: { date: 'asc' },
    });

    const grouped = new Map<string, SupplementTrendItem['items']>();

    for (const log of logs) {
      const dateKey = dateString(log.date);
      const group = grouped.get(dateKey);
      if (group) {
        group.push({
          name: flattenName(log.supplement.name as SupplementName, locale),
          amount: log.amount,
          unit: log.supplement.unit,
        });
      } else {
        grouped.set(dateKey, [
          {
            name: flattenName(log.supplement.name as SupplementName, locale),
            amount: log.amount,
            unit: log.supplement.unit,
          },
        ]);
      }
    }

    const result: SupplementTrendItem[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateKey = dateString(current);
      const items = grouped.get(dateKey) ?? [];
      result.push({
        date: dateKey,
        hasLogged: items.length > 0,
        totalItems: items.length,
        items,
      });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }
}

function flattenName(name: SupplementName, locale: string): string {
  const map = name as Record<string, string>;
  return map[locale] || map.en || map.it || '';
}
