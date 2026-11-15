import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Корень репо: server/src/core/config.js → ../../..
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export const config = {
  port: Number(process.env.PORT || 3001),
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  seedDemo: process.env.SEED_DEMO !== 'false',
  dataDir: path.resolve(root, process.env.DATA_DIR || './data'),
  uploadsDir: path.resolve(root, process.env.UPLOADS_DIR || './uploads'),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 10),
  isProd: process.env.NODE_ENV === 'production',
};

fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(config.uploadsDir, { recursive: true });
