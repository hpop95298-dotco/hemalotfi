import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

// Try to set webSocketConstructor safely
try {
  neonConfig.webSocketConstructor = ws;
} catch (e) {
  console.error("Failed to set neon webSocketConstructor:", e);
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("[CRITICAL] DATABASE_URL is missing in environment variables!");
}

// Initialize pool with extra error handling
export const pool = new Pool({ 
  connectionString: dbUrl || "",
  connectionTimeoutMillis: 5000 
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });