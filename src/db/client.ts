// Database client (server-only). Uses postgres-js over the Neon pooled
// connection. Instantiated lazily so that `next build` (which does not have a
// database) never needs a live connection — all data pages are force-dynamic.

import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: PostgresJsDatabase<typeof schema> | null = null;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
    );
  }
  const client = postgres(url, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    prepare: false, // required for pgBouncer / Neon pooled connections
  });
  _db = drizzle(client, { schema });
  return _db;
}

export { schema };
