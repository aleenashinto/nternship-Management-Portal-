// Starts a real PostgreSQL via the embedded-postgres package (used when Docker is unavailable).
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";

async function main() {
  const dir = process.env.PGDATA_DIR ?? "./.pgdata";
  const port = Number(process.env.PGPORT ?? 5433);
  const pg = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "postgres", port, persistent: true });

  const fresh = !fs.existsSync(`${dir}/PG_VERSION`);
  if (fresh) await pg.initialise();
  await pg.start();
  if (fresh) await pg.createDatabase(process.env.PGDB ?? "portal");
  console.log(`Postgres ready on port ${port}`);
  process.on("SIGINT", async () => { await pg.stop(); process.exit(0); });
  setInterval(() => {}, 1 << 30);
}
main();
