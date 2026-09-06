import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * DATABASE_URL is optional at build time (Vercel has no DB env by default).
 *
 * Never throw or open a TCP connection when this module is imported —
 * Next.js "Collecting page data" imports API routes during `next build`.
 * PostgreSQL is a best-effort backend; localStorage is the primary store.
 */
const databaseUrl = process.env.DATABASE_URL ?? "";

export const isDatabaseConfigured = Boolean(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: NodePgDatabase;
};

function getPool(): Pool | null {
  if (!isDatabaseConfigured) return null;

  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    });
  }

  return globalForDb.__arenaNextJsPostgresqlPool;
}

function getDb(): NodePgDatabase {
  if (globalForDb.__arenaNextJsPostgresqlDb) {
    return globalForDb.__arenaNextJsPostgresqlDb;
  }

  const pool = getPool();
  if (!pool) {
    throw new Error(
      "DATABASE_URL is not configured. This operation needs PostgreSQL.",
    );
  }

  globalForDb.__arenaNextJsPostgresqlDb = drizzle(pool);
  return globalForDb.__arenaNextJsPostgresqlDb;
}

/**
 * Lazy Drizzle client. Importing this module is always safe.
 * Queries throw only if DATABASE_URL is missing AND a query actually runs
 * (call sites wrap DB work in try/catch).
 */
export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_target, prop, _receiver) {
    const real = getDb();
    const value = Reflect.get(real as object, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

/** @deprecated Use getPool() internally; kept for compatibility. */
export const pool: Pool | null = null;
