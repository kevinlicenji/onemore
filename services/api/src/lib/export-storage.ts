import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { Env } from '../config/env.js';

/**
 * Local filesystem storage for GDPR export bundles (R2 in production via separate deploy config).
 */
export class ExportStorageService {
  private readonly basePath: string;

  /**
   * @param env - Application environment.
   */
  constructor(env: Env) {
    this.basePath = env.EXPORT_STORAGE_PATH;
  }

  /**
   * Persist export files for a job.
   *
   * @param storageKey - Relative storage path prefix.
   * @param jsonContent - Full JSON export payload.
   * @param csvContent - Workouts CSV content.
   */
  async saveExport(storageKey: string, jsonContent: string, csvContent: string): Promise<void> {
    const dir = join(this.basePath, storageKey);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'export.json'), jsonContent, 'utf8');
    await writeFile(join(dir, 'workouts.csv'), csvContent, 'utf8');
  }

  /**
   * Read export JSON for download.
   *
   * @param storageKey - Stored key from the export job.
   */
  async readJson(storageKey: string): Promise<Buffer> {
    return readFile(join(this.basePath, storageKey, 'export.json'));
  }

  /**
   * Read workouts CSV for download.
   *
   * @param storageKey - Stored key from the export job.
   */
  async readCsv(storageKey: string): Promise<Buffer> {
    return readFile(join(this.basePath, storageKey, 'workouts.csv'));
  }

  /**
   * Build a public download URL served by the API.
   *
   * @param env - Environment with API public URL.
   * @param jobId - Export job id.
   * @param token - One-time download token.
   * @param format - File format to download.
   */
  buildDownloadUrl(env: Env, jobId: string, token: string, format: 'json' | 'csv'): string {
    return `${env.API_PUBLIC_URL}/api/v1/users/me/export/${jobId}/download?token=${encodeURIComponent(token)}&format=${format}`;
  }
}

/**
 * Ensure parent directory exists before writing.
 *
 * @param filePath - Absolute file path.
 */
export async function ensureParentDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}
