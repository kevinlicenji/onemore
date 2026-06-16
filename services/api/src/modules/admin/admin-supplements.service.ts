import type {
  AdminCreateSupplement,
  AdminSupplement,
  AdminUpdateSupplement,
} from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';

export class AdminSupplementsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<AdminSupplement[]> {
    const rows = await this.prisma.supplement.findMany({
      where: { userId: null, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toAdminSupplement(r));
  }

  async create(input: AdminCreateSupplement): Promise<AdminSupplement> {
    const created = await this.prisma.supplement.create({
      data: {
        name: { it: input.nameIt, en: input.nameEn },
        unit: input.unit,
        userId: null,
        brand: null,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    });
    return this.toAdminSupplement(created);
  }

  async update(supplementId: string, input: AdminUpdateSupplement): Promise<AdminSupplement> {
    const existing = await this.requireGlobal(supplementId);
    const updated = await this.prisma.supplement.update({
      where: { id: existing.id },
      data: {
        ...(input.nameIt !== undefined || input.nameEn !== undefined
          ? {
              name: {
                it: input.nameIt ?? (existing.name as { it: string; en: string }).it,
                en: input.nameEn ?? (existing.name as { it: string; en: string }).en,
              },
            }
          : {}),
        ...(input.unit ? { unit: input.unit } : {}),
      },
    });
    return this.toAdminSupplement(updated);
  }

  async delete(supplementId: string): Promise<void> {
    const existing = await this.requireGlobal(supplementId);
    await this.prisma.supplement.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });
  }

  private async requireGlobal(supplementId: string) {
    const supp = await this.prisma.supplement.findFirst({
      where: { id: supplementId, userId: null, deletedAt: null },
    });
    if (!supp) {
      throw new HttpError(404, 'Global supplement not found', 'SUPPLEMENT_NOT_FOUND');
    }
    return supp;
  }

  private toAdminSupplement(row: {
    id: string;
    name: unknown;
    unit: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AdminSupplement {
    return {
      id: row.id,
      name: row.name as AdminSupplement['name'],
      unit: row.unit as AdminSupplement['unit'],
      deletedAt: row.deletedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
