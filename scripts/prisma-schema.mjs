import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function loadEnv(file) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv(".env");
loadEnv(".env.local");

const url = process.env.DATABASE_URL || "";
const isPostgres = /^postgres(ql)?:\/\//i.test(url);
const schema = isPostgres ? "prisma/schema.postgres.prisma" : "prisma/schema.prisma";

if (!existsSync(schema)) {
  console.error(`[prisma-schema] schema not found: ${schema}`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("[prisma-schema] usage: node scripts/prisma-schema.mjs <prisma args...>");
  process.exit(1);
}

console.log(`[prisma-schema] DATABASE_URL=${isPostgres ? "postgres" : "sqlite"} -> ${schema}`);
const res = spawnSync("npx", ["prisma", ...args, "--schema", schema], {
  stdio: "inherit",
  shell: true,
});
process.exit(res.status ?? 1);
