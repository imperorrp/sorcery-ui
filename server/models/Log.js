/**
 * Log model: Mongoose schema for server logs
 *
 * Used by `lib/logger.js` to persist structured logs to MongoDB when available.
 */
import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: ['info', 'warn', 'error', 'debug'],
    default: 'info'
  },
  message: {
    type: String,
    required: true
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create a capped collection to prevent logs from growing indefinitely
// Size is in bytes (e.g., 50MB)
// Max is max number of documents
// Note: Capped collections cannot be sharded.
// If you don't want capped, remove the 'capped' property.
// For a simple system, capped is nice to auto-rotate logs.
// However, 'capped' options in mongoose schema definition:
// logSchema.set('capped', { size: 52428800, max: 100000 }); 

const Log = mongoose.model('Log', logSchema);

export default Log;
