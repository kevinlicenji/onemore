import { describe, expect, it, vi } from 'vitest';

import { SupplementsService } from './supplements.service.js';

function createMockPrisma() {
  return {
    supplement: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    supplementLog: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
    },
  };
}

describe('SupplementsService', () => {
  describe('list', () => {
    it('returns supplements with flattened name', async () => {
      const prisma = createMockPrisma();
      prisma.supplementLog.groupBy = vi.fn(() => Promise.resolve([]));
      prisma.supplement.findMany = vi.fn(() =>
        Promise.resolve([
          {
            id: 'sup-1',
            name: { it: 'Creatina', en: 'Creatine' },
            brand: 'ON',
            unit: 'g',
            userId: null,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      );

      const service = new SupplementsService(prisma as never);
      const result = await service.list('user-1', 'en');

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Creatine');
      expect(result[0]?.isGlobal).toBe(true);
      expect(result[0]?.recentLogCount).toBe(0);
    });
  });

  describe('getById', () => {
    it('returns supplement detail', async () => {
      const prisma = createMockPrisma();
      prisma.supplement.findFirst = vi.fn(() =>
        Promise.resolve({
          id: 'sup-1',
          name: { it: 'Creatina', en: 'Creatine' },
          brand: 'ON',
          unit: 'g',
          userId: null,
          calories: 10,
          protein: 0,
          carbs: 0,
          fat: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-02'),
        }),
      );

      const service = new SupplementsService(prisma as never);
      const result = await service.getById('user-1', 'sup-1', 'it');

      expect(result.name).toBe('Creatina');
      expect(result.isGlobal).toBe(true);
    });

    it('throws when not found', async () => {
      const prisma = createMockPrisma();
      prisma.supplement.findFirst = vi.fn(() => Promise.resolve(null));

      const service = new SupplementsService(prisma as never);
      await expect(service.getById('user-1', 'missing', 'en')).rejects.toThrow(
        'Supplement not found',
      );
    });
  });

  describe('create', () => {
    it('creates a private supplement', async () => {
      const prisma = createMockPrisma();
      prisma.supplement.create = vi.fn(() =>
        Promise.resolve({
          id: 'sup-new',
          name: { it: 'Creatina', en: 'Creatine' },
          brand: null,
          unit: 'g',
          userId: 'user-1',
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const service = new SupplementsService(prisma as never);
      const result = await service.create(
        'user-1',
        {
          name: { it: 'Creatina', en: 'Creatine' },
          unit: 'g',
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
        'it',
      );

      expect(result.isGlobal).toBe(false);
      expect(result.name).toBe('Creatina');
    });
  });

  describe('update', () => {
    it('clones global supplement silently', async () => {
      const prisma = createMockPrisma();
      prisma.supplement.findUnique = vi.fn(() =>
        Promise.resolve({
          id: 'sup-global',
          name: { it: 'Vecchia', en: 'Old' },
          brand: null,
          unit: 'g',
          userId: null,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        }),
      );
      prisma.supplement.create = vi.fn(() =>
        Promise.resolve({
          id: 'sup-clone',
          name: { it: 'Nuova', en: 'New' },
          brand: null,
          unit: 'g',
          userId: 'user-1',
          calories: 5,
          protein: 0,
          carbs: 0,
          fat: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const service = new SupplementsService(prisma as never);
      const result = await service.update(
        'user-1',
        'sup-global',
        {
          name: { it: 'Nuova', en: 'New' },
          calories: 5,
        },
        'en',
      );

      expect(prisma.supplement.create).toHaveBeenCalledOnce();
      expect(result.name).toBe('New');
      expect(result.isGlobal).toBe(false);
    });

    it('updates own supplement directly', async () => {
      const prisma = createMockPrisma();
      prisma.supplement.findUnique = vi.fn(() =>
        Promise.resolve({
          id: 'sup-own',
          name: { it: 'Vecchia', en: 'Old' },
          brand: null,
          unit: 'g',
          userId: 'user-1',
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        }),
      );
      prisma.supplement.update = vi.fn(() =>
        Promise.resolve({
          id: 'sup-own',
          name: { it: 'Nuova', en: 'New' },
          brand: null,
          unit: 'g',
          userId: 'user-1',
          calories: 5,
          protein: 0,
          carbs: 0,
          fat: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const service = new SupplementsService(prisma as never);
      const result = await service.update(
        'user-1',
        'sup-own',
        {
          name: { it: 'Nuova', en: 'New' },
          calories: 5,
        },
        'en',
      );

      expect(prisma.supplement.update).toHaveBeenCalledOnce();
      expect(result.name).toBe('New');
    });
  });

  describe('delete', () => {
    it('deletes own supplement', async () => {
      const prisma = createMockPrisma();
      prisma.supplement.findUnique = vi.fn(() =>
        Promise.resolve({
          id: 'sup-1',
          userId: 'user-1',
        }),
      );
      prisma.supplement.delete = vi.fn(() => Promise.resolve({}));

      const service = new SupplementsService(prisma as never);
      await expect(service.delete('user-1', 'sup-1')).resolves.not.toThrow();
    });

    it('throws on global supplement', async () => {
      const prisma = createMockPrisma();
      prisma.supplement.findUnique = vi.fn(() =>
        Promise.resolve({
          id: 'sup-global',
          userId: null,
        }),
      );

      const service = new SupplementsService(prisma as never);
      await expect(service.delete('user-1', 'sup-global')).rejects.toThrow('Supplement not found');
    });
  });

  describe('listLogs', () => {
    it('returns paginated logs with flattened name', async () => {
      const prisma = createMockPrisma();
      prisma.supplementLog.findMany = vi.fn(() =>
        Promise.resolve([
          {
            id: 'log-1',
            supplementId: 'sup-1',
            amount: 5,
            notes: null,
            date: new Date('2026-06-15'),
            createdAt: new Date('2026-06-15'),
            supplement: {
              name: { it: 'Creatina', en: 'Creatine' },
              unit: 'g',
            },
          },
        ]),
      );

      const service = new SupplementsService(prisma as never);
      const result = await service.listLogs('user-1', { limit: 50 }, 'en');

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0]?.supplementName).toBe('Creatine');
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('createLog', () => {
    it('creates a supplement log', async () => {
      const prisma = createMockPrisma();
      prisma.supplement.findFirst = vi.fn(() =>
        Promise.resolve({ id: 'sup-1', userId: null, name: { it: 'X', en: 'X' }, unit: 'g' }),
      );
      prisma.supplementLog.create = vi.fn(() =>
        Promise.resolve({
          id: 'log-1',
          supplementId: 'sup-1',
          amount: 10,
          notes: null,
          date: new Date('2026-06-15'),
          createdAt: new Date('2026-06-15'),
          supplement: {
            name: { it: 'Creatina', en: 'Creatine' },
            unit: 'g',
          },
        }),
      );

      const service = new SupplementsService(prisma as never);
      const result = await service.createLog(
        'user-1',
        {
          supplementId: 'sup-1',
          amount: 10,
          date: '2026-06-15T00:00:00.000Z',
        },
        'it',
      );

      expect(result.supplementName).toBe('Creatina');
    });
  });

  describe('updateLog', () => {
    it('updates own log', async () => {
      const prisma = createMockPrisma();
      prisma.supplementLog.findUnique = vi.fn(() =>
        Promise.resolve({
          id: 'log-1',
          userId: 'user-1',
          supplementId: 'sup-1',
        }),
      );
      prisma.supplementLog.update = vi.fn(() =>
        Promise.resolve({
          id: 'log-1',
          supplementId: 'sup-1',
          amount: 20,
          notes: 'updated',
          date: new Date('2026-06-15'),
          createdAt: new Date('2026-06-15'),
          supplement: {
            name: { it: 'Creatina', en: 'Creatine' },
            unit: 'g',
          },
        }),
      );

      const service = new SupplementsService(prisma as never);
      const result = await service.updateLog(
        'user-1',
        {
          id: 'log-1',
          amount: 20,
          notes: 'updated',
        },
        'en',
      );

      expect(result.amount).toBe(20);
    });
  });

  describe('deleteLog', () => {
    it('deletes own log', async () => {
      const prisma = createMockPrisma();
      prisma.supplementLog.findUnique = vi.fn(() =>
        Promise.resolve({ id: 'log-1', userId: 'user-1' }),
      );
      prisma.supplementLog.delete = vi.fn(() => Promise.resolve({}));

      const service = new SupplementsService(prisma as never);
      await expect(service.deleteLog('user-1', 'log-1')).resolves.not.toThrow();
    });
  });

  describe('repeatYesterday', () => {
    it('copies yesterday logs to today', async () => {
      const prisma = createMockPrisma();
      prisma.supplementLog.findMany = vi.fn(() =>
        Promise.resolve([
          {
            id: 'log-y-1',
            supplementId: 'sup-1',
            amount: 5,
            notes: 'test',
            date: new Date('2026-06-14'),
            createdAt: new Date('2026-06-14'),
            supplement: { name: { it: 'X', en: 'X' }, unit: 'g' },
          },
        ]),
      );
      prisma.supplementLog.create = vi.fn(() =>
        Promise.resolve({
          id: 'log-new',
          supplementId: 'sup-1',
          amount: 5,
          notes: 'test',
          date: new Date('2026-06-15'),
          createdAt: new Date('2026-06-15'),
          supplement: { name: { it: 'X', en: 'X' }, unit: 'g' },
        }),
      );

      const service = new SupplementsService(prisma as never);
      const result = await service.repeatYesterday('user-1', '2026-06-15T00:00:00.000Z', 'en');

      expect(result.totalCount).toBe(1);
      expect(result.logs).toHaveLength(1);
    });
  });

  describe('getTrend', () => {
    it('returns trend data for N days', async () => {
      const prisma = createMockPrisma();
      prisma.supplementLog.findMany = vi.fn(() =>
        Promise.resolve([
          {
            supplementId: 'sup-1',
            amount: 5,
            date: new Date(),
            supplement: { name: { it: 'X', en: 'X' }, unit: 'g' },
          },
        ]),
      );

      const service = new SupplementsService(prisma as never);
      const result = await service.getTrend('user-1', 7, 'en');

      expect(result).toHaveLength(7);
      const today = result.find((d) => d.hasLogged);
      expect(today?.totalItems).toBe(1);
    });
  });
});
