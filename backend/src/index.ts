import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import logger from './config/logger';
import prisma from './config/prisma';
import routes from './routes';

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { message: '请求过于频繁，请稍后再试' },
  }),
);

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ensure password_resets and images tables exist
(async () => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(255) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        expires_at DATETIME NOT NULL,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id)
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS images (
        id VARCHAR(36) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        size INT NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);
  } catch {}
})();

// API routes
app.use('/api', routes);

// 404
app.use((_req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

app.listen(config.port, () => {
  logger.info(`Server running on http://localhost:${config.port} [${config.nodeEnv}]`);
});

export default app;
