import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: resolve(__dirname, "../../../.env") });

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/resume";

async function main() {
  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  const client = new pg.Client({ connectionString });
  await client.connect();
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    await client.query(sql);
    console.log(`Migration ${file} applied.`);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
