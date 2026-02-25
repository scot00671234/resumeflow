import { readFileSync } from "fs";
import { join, resolve } from "path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: resolve(__dirname, "../../../.env") });

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/resume";

async function main() {
  const sql = readFileSync(join(__dirname, "migrations", "0000_init.sql"), "utf-8");
  const client = new pg.Client({ connectionString });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("Migration 0000_init applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
