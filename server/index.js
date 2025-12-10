/**
 * Server Entry Point
 *
 * This Express server exposes API routes for AI-powered design system generation
 * and other server-side utilities. It uses middleware for CORS, logging, and JSON
 * body parsing (with larger payload support for embedded images). The server
 * registers the AI routes under `/api/ai` and includes a health check endpoint.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './lib/db.js';
import mongoose from 'mongoose';
import logger from './lib/logger.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(logger.requestLogger); // Add logging middleware
// Increase payload limit for base64 images if passed directly in JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  const ready = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: 'ok',
    timestamp: new Date().toLocaleString(),
    db: {
      readyState: ready,
      status: states[ready] || 'unknown',
      host: mongoose.connection.host || null
    }
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
