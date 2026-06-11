import type { DataExportJob as DataExportJobDto } from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';

import type { Env } from '../../config/env.js';
import { HttpError } from '../../lib/errors.js';
import { ExportStorageService } from '../../lib/export-storage.js';
import type { EmailService } from '../../lib/email.js';
import { generateSecureToken, hashToken } from '../../lib/hash.js';
import type { Logger } from '../../lib/logger.js';
import { buildGdprExportBundle } from './export-data-builder.js';

const EXPORT_TTL_HOURS = 72;
const EXPORT_COOLDOWN_HOURS = 24;

/**
 * GDPR self-service data export jobs.
 */
export class GdprExportService {
  private readonly storage: ExportStorageService;

  /**
   * @param prisma - Database client.
   * @param env - Application environment.
   * @param emailService - Transactional email sender.
   * @param logger - Structured logger.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly env: Env,
    private readonly emailService: EmailService,
    private readonly logger: Logger,
  ) {
    this.storage = new ExportStorageService(env);
  }

  /**
   * Queue a new export job for the authenticated user.
   *
   * @param userId - User requesting export.
   */
  async requestExport(userId: string): Promise<DataExportJobDto> {
    const recent = await this.prisma.dataExportJob.findFirst({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - EXPORT_COOLDOWN_HOURS * 60 * 60 * 1000) },
        status: { in: ['pending', 'processing', 'completed'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recent) {
      throw new HttpError(
        429,
        'Export already requested recently. Try again in 24 hours.',
        'EXPORT_RATE_LIMITED',
      );
    }

    const job = await this.prisma.dataExportJob.create({
      data: { userId, status: 'pending' },
    });

    return this.toDto(job);
  }

  /**
   * Process a pending export job (called by worker or inline fallback).
   *
   * @param jobId - Export job id.
   */
  async processExportJob(jobId: string): Promise<void> {
    const job = await this.prisma.dataExportJob.findUnique({
      where: { id: jobId },
      include: { user: true },
    });

    if (!job || job.status === 'completed') {
      return;
    }

    await this.prisma.dataExportJob.update({
      where: { id: jobId },
      data: { status: 'processing' },
    });

    try {
      const bundle = await buildGdprExportBundle(this.prisma, job.userId);
      const storageKey = `${job.userId}/${jobId}`;
      await this.storage.saveExport(storageKey, bundle.json, bundle.csv);

      const downloadToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + EXPORT_TTL_HOURS * 60 * 60 * 1000);

      await this.prisma.dataExportJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          storageKey,
          downloadTokenHash: hashToken(downloadToken),
          expiresAt,
          completedAt: new Date(),
        },
      });

      const jsonUrl = this.storage.buildDownloadUrl(this.env, jobId, downloadToken, 'json');
      const csvUrl = this.storage.buildDownloadUrl(this.env, jobId, downloadToken, 'csv');

      await this.emailService.send({
        to: job.user.email,
        subject: 'Your OneMore data export is ready',
        html: `<p>Your data export is ready. Links expire in ${String(EXPORT_TTL_HOURS)} hours.</p>
<p><a href="${jsonUrl}">Download JSON</a></p>
<p><a href="${csvUrl}">Download CSV</a></p>`,
      });

      this.logger.info({ userId: job.userId, jobId }, 'GDPR export completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      await this.prisma.dataExportJob.update({
        where: { id: jobId },
        data: { status: 'failed', errorMessage: message },
      });
      this.logger.error({ userId: job.userId, jobId, err: message }, 'GDPR export failed');
      throw error;
    }
  }

  /**
   * Get latest export job for the user.
   *
   * @param userId - Authenticated user id.
   */
  async getLatestJob(userId: string): Promise<DataExportJobDto | null> {
    const job = await this.prisma.dataExportJob.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return job ? this.toDto(job) : null;
  }

  /**
   * Download export file when token is valid.
   *
   * @param userId - Authenticated user id.
   * @param jobId - Export job id.
   * @param token - Raw download token from email.
   * @param format - json or csv.
   */
  async downloadExport(
    userId: string,
    jobId: string,
    token: string,
    format: 'json' | 'csv',
  ): Promise<Buffer> {
    const job = await this.prisma.dataExportJob.findFirst({
      where: { id: jobId, userId, status: 'completed' },
    });

    if (!job?.storageKey || !job.downloadTokenHash || !job.expiresAt) {
      throw new HttpError(404, 'Export not found', 'EXPORT_NOT_FOUND');
    }

    if (job.expiresAt < new Date()) {
      throw new HttpError(410, 'Export link expired', 'EXPORT_EXPIRED');
    }

    if (hashToken(token) !== job.downloadTokenHash) {
      throw new HttpError(403, 'Invalid download token', 'EXPORT_TOKEN_INVALID');
    }

    return format === 'json'
      ? this.storage.readJson(job.storageKey)
      : this.storage.readCsv(job.storageKey);
  }

  private toDto(job: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    completedAt: Date | null;
    expiresAt: Date | null;
  }): DataExportJobDto {
    return {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
      expiresAt: job.expiresAt?.toISOString() ?? null,
      downloadReady: job.status === 'completed',
    };
  }
}
