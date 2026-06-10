import { loadEnv } from './config/env.js';
import { createApp } from './app.js';
import { createLogger } from './lib/logger.js';

const env = loadEnv();
const logger = createLogger(env);
const app = createApp(env, logger);

app.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT }, 'API server listening');
});
