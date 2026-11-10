import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const isDummyDb = (url?: string) => {
  const target = url ?? process.env.DATABASE_URL ?? "";
  return !target || target.includes("user:password@host") || target.includes("placeholder");
};

const connString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/placeholder";
const sql = neon(connString);
export const db = drizzle(sql, { schema });
