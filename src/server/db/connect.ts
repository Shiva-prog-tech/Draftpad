import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongoose: GlobalMongoose | undefined;
}

let cached = global.__mongoose;
if (!cached) {
  cached = global.__mongoose = { conn: null, promise: null };
}

const CONNECT_OPTS: mongoose.ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  // Generous timeouts — on slow / NAT64 networks the TLS handshake to Atlas can
  // take well over 10s, which was being cut off as `secureConnect timed out`.
  serverSelectionTimeoutMS: 30_000,
  connectTimeoutMS: 30_000,
  socketTimeoutMS: 45_000,
  // Auto-retry transient network blips on both reads and writes.
  retryWrites: true,
  retryReads: true,
};

export async function connectDB(): Promise<typeof mongoose> {
  // Reuse a live connection.
  if (cached!.conn && cached!.conn.connection.readyState === 1) return cached!.conn;

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, CONNECT_OPTS).catch((err) => {
      // IMPORTANT: clear the cached promise on failure so the NEXT request retries
      // instead of forever awaiting this same rejected promise (e.g. a transient
      // `getaddrinfo ENOTFOUND` on a flaky / NAT64 network).
      cached!.promise = null;
      throw err;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (err) {
    cached!.conn = null;
    throw err;
  }
  return cached!.conn;
}
