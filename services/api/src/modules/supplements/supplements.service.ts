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
import type { PrismaClient } from '@prisma/client';

import type { Prisma, SupplementUnit } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';

type SupplementName = { it: string; en: string };

export class SupplementsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(userId: string, locale: string): Promise<SupplementListItem[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentCounts, supplements] = await Promise.all([
      this.prisma.supplementLog.groupBy({
        by: ['supplementId'],
        where: { userId, date: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      this.prisma.supplement.findMany({
        where: { OR: [{ userId: null }, { userId }] },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const countMap = new Map(recentCounts.map((r) => [r.supplementId, r._count]));

    return supplements.map((s) => ({
      id: s.id,
      name: flattenName(s.name as SupplementName, locale),
      brand: s.brand,
      unit: s.unit as SupplementListItem['unit'],
      isGlobal: s.userId === null,
      calories: s.calories,
      protein: s.protein,
      carbs: s.carbs,
      fat: s.fat,
      recentLogCount: countMap.get(s.id) ?? 0,
    }));
  }

  async getById(userId: string, supplementId: string, locale: string): Promise<SupplementDetail> {
    const supplement = await this.prisma.supplement.findFirst({
      where: {
        id: supplementId,
        OR: [{ userId: null }, { userId }],
      },
    });

    if (!supplement) {
      throw new HttpError(404, 'Supplement not found', 'SUPPLEMENT_NOT_FOUND');
    }

    return {
      id: supplement.id,
      name: flattenName(supplement.name as SupplementName, locale),
      brand: supplement.brand,
      unit: supplement.unit as SupplementDetail['unit'],
      isGlobal: supplement.userId === null,
      calories: supplement.calories,
      protein: supplement.protein,
      carbs: supplement.carbs,
      fat: supplement.fat,
      createdAt: supplement.createdAt.toISOString(),
      updatedAt: supplement.updatedAt.toISOString(),
    };
  }

  async create(userId: string, input: CreateSupplementInput, locale?: string): Promise<SupplementDetail> {
    const supplement = await this.prisma.supplement.create({
      data: {
        name: input.name,
        brand: input.brand ?? null,
        unit: input.unit,
        userId,
        calories: input.calories ?? 0,
        protein: input.protein ?? 0,
        carbs: input.carbs ?? 0,
        fat: input.fat ?? 0,
      },
    });

    return {
      id: supplement.id,
      name: flattenName(supplement.name as SupplementName, locale ?? 'en'),
      brand: supplement.brand,
      unit: supplement.unit as SupplementDetail['unit'],
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
    const existing = await this.prisma.supplement.findUnique({
      where: { id: supplementId },
    });

    if (!existing) {
      throw new HttpError(404, 'Supplement not found', 'SUPPLEMENT_NOT_FOUND');
    }

    if (existing.userId === null) {
      const cloned = await this.prisma.supplement.create({
        data: {
          name: input.name ?? (existing.name as SupplementName),
          brand: input.brand !== undefined ? input.brand : existing.brand,
          unit: (input.unit ?? existing.unit) as SupplementUnit,
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
        unit: cloned.unit as SupplementDetail['unit'],
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
        name: input.name as object | undefined,
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
      unit: updated.unit as SupplementDetail['unit'],
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

    if (!existing || existing.userId !== userId) {
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
    if (hasMore) logs.pop();

    return {
      logs: logs.map((log) => ({
        id: log.id,
        supplementId: log.supplementId,
        supplementName: flattenName(log.supplement.name as SupplementName, locale),
        supplementUnit: log.supplement.unit as SupplementLogItem['supplementUnit'],
        amount: log.amount,
        notes: log.notes,
        date: log.date.toISOString(),
        createdAt: log.createdAt.toISOString(),
      })),
      nextCursor: hasMore && logs.length > 0 ? logs[logs.length - 1]!.date.toISOString() : null,
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
        OR: [{ userId: null }, { userId }],
      },
    });

    if (!supplement) {
      throw new HttpError(404, 'Supplement not found', 'SUPPLEMENT_NOT_FOUND');
    }

    const log = await this.prisma.supplementLog.create({
      data: {
        userId,
        supplementId: input.supplementId,
        amount: input.amount,
        notes: input.notes ?? null,
        date: new Date(input.date),
      },
      include: {
        supplement: { select: { name: true, unit: true } },
      },
    });

    return {
      id: log.id,
      supplementId: log.supplementId,
      supplementName: flattenName(log.supplement.name as SupplementName, locale),
      supplementUnit: log.supplement.unit as SupplementLogItem['supplementUnit'],
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
        date: input.date ? new Date(input.date) : undefined,
        supplementId: input.supplementId,
      },
      include: {
        supplement: { select: { name: true, unit: true } },
      },
    });

    return {
      id: log.id,
      supplementId: log.supplementId,
      supplementName: flattenName(log.supplement.name as SupplementName, locale),
      supplementUnit: log.supplement.unit as SupplementLogItem['supplementUnit'],
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

    const yesterdayLogs = await this.prisma.supplementLog.findMany({
      where: {
        userId,
        date: {
          gte: new Date(yesterday.toISOString().split('T')[0] + 'T00:00:00.000Z'),
          lt: new Date(today.toISOString().split('T')[0] + 'T00:00:00.000Z'),
        },
      },
      include: {
        supplement: { select: { name: true, unit: true } },
      },
    });

    const dayStart = new Date(today.toISOString().split('T')[0] + 'T00:00:00.000Z');

    const createdLogs = [];
    for (const log of yesterdayLogs) {
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
    }

    return {
      date: date.split('T')[0]!,
      logs: createdLogs.map((log) => ({
        id: log.id,
        supplementId: log.supplementId,
        supplementName: flattenName(log.supplement.name as SupplementName, locale),
        supplementUnit: log.supplement.unit as SupplementLogItem['supplementUnit'],
        amount: log.amount,
        notes: log.notes,
        date: log.date.toISOString(),
        createdAt: log.createdAt.toISOString(),
      })),
      totalCount: createdLogs.length,
    };
  }

  async getTrend(
    userId: string,
    days: number,
    locale: string,
  ): Promise<SupplementTrendItem[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const logs = await this.prisma.supplementLog.findMany({
      where: {
        userId,
        date: {
          gte: new Date(startDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
          lte: new Date(endDate.toISOString().split('T')[0] + 'T23:59:59.999Z'),
        },
      },
      include: {
        supplement: { select: { name: true, unit: true } },
      },
      orderBy: { date: 'asc' },
    });

    const grouped = new Map<string, SupplementTrendItem['items']>();

    for (const log of logs) {
      const dateKey = log.date.toISOString().split('T')[0]!;
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push({
        name: flattenName(log.supplement.name as SupplementName, locale),
        amount: log.amount,
        unit: log.supplement.unit as SupplementTrendItem['items'][number]['unit'],
      });
    }

    const result: SupplementTrendItem[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0]!;
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
  return (name as Record<string, string>)[locale] || name.en || name.it || '';
}
