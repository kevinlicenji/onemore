import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');

/** PEM paths for Vitest and local test runs. */
export const TEST_JWT_PRIVATE_KEY_PATH = path.join(apiRoot, 'test/fixtures/jwt-private.pem');
export const TEST_JWT_PUBLIC_KEY_PATH = path.join(apiRoot, 'test/fixtures/jwt-public.pem');
