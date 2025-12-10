/**
 * Simple multi-target logger used by the server.
 *
 * Behavior:
 * - Logs to console for quick debugging
 * - Writes plain text logs to `logs/combined.log`
 * - Optionally writes structured logs to MongoDB if connected
 *
 * The logger exports a middleware `requestLogger` suitable for Express.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Log from '../models/Log.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'combined.log');

const saveLog = async (level, message, meta = {}) => {
  // Human-readable timestamp at the beginning of each log
  const now = new Date();
  const timestamp = now.toLocaleString();
  const upper = level.toUpperCase();

  // Prepare a concise log line for console and file
  const metaStr = (meta && Object.keys(meta).length) ? ` | ${JSON.stringify(meta)}` : '';
  const line = `${timestamp} [${upper}] ${message}${metaStr}`;

  // 1. Console Log (timestamp first, human-friendly)
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }

  // 2. File Log (Fallback/Persistent) - plain text, timestamp first
  try {
    const fileMsg = `${line}\n`;
    fs.appendFile(logFile, fileMsg, (err) => {
      if (err) console.error(`${new Date().toLocaleString()} [ERROR] Failed to write to log file:`, err);
    });
  } catch (err) {
    console.error(`${new Date().toLocaleString()} [ERROR] Failed to write to log file:`, err);
  }

  // 3. MongoDB Log (store structured data)
  try {
    // Only try to save if mongoose is connected
    if (mongoose.connection.readyState === 1) {
      await Log.create({
        level,
        message,
        meta,
        timestamp: now
      });
    }
  } catch (err) {
    // Silent fail for DB logs if DB is down; file log acts as fallback
  }
};

const logger = {
  info: (message, meta) => saveLog('info', message, meta),
  warn: (message, meta) => saveLog('warn', message, meta),
  error: (message, meta) => saveLog('error', message, meta),
  debug: (message, meta) => saveLog('debug', message, meta),
  
  // Middleware for Express
  requestLogger: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    });
    next();
  }
};

export default logger;
