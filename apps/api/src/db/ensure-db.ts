import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

const url = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/resume";
const targetDb = "resume";

function getPostgresUrl(database: string): string {
  try {
    const u = new URL(url);
    u.pathname = database === "" ? "/postgres" : `/${database}`;
    return u.toString();
  } catch {
    return `postgresql://postgres:postgres@localhost:5432/${database || "postgres"}`;
  }
}

async function main() {
  const client = new pg.Client({ connectionString: getPostgresUrl("postgres") });
  await client.connect();
  const r = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [targetDb]
  );
  if (r.rows.length === 0) {
    await client.query(`CREATE DATABASE resume`);
    console.log(`Database "${targetDb}" created.`);
  } else {
    console.log(`Database "${targetDb}" already exists.`);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
