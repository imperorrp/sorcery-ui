/**
 * MongoDB Connection Helper
 *
 * Attempts to establish a connection to MongoDB using the `MONGO_URI` and
 * `MONGO_DB_NAME` environment variables. If the connection fails, the app
 * continues to run but database-backed features will be disabled.
 */
/**
 * Database connection helper
 *
 * Attempts to connect to MongoDB using `MONGO_URI` from the environment.
 * - If the connection is successful, logs the host, and the server can
 *   optionally store structured logs in the DB.
 * - If the connection fails, the function logs a warning and the server
 *   continues to run in a degraded mode where logs are persisted to disk.
 *
 * This behavior prevents the UI from being unusable due to a missing DB
 * during local development. The app prefers to operate fully with DB if present.
 */
import mongoose from 'mongoose';

/**
 * connectDB - Attempt to establish a connection to MongoDB using the
 * provided `MONGO_URI` and optional `MONGO_DB_NAME` environment variables.
 * The function logs connection progress and avoids process exit on failure
 * to allow the application to operate as a local-only server without DB.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sorcery-ui';
    console.log(`Attempting MongoDB connection to: ${mongoUri}`);
    const conn = await mongoose.connect(mongoUri, { dbName: process.env.MONGO_DB_NAME || undefined });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error('MongoDB connection failed. Application will run without database features.');
    // process.exit(1); // Don't exit, allow app to run with file logging
  }
};

export default connectDB;
