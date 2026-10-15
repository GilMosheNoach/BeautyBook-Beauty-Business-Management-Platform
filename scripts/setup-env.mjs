// Creates .env from .env.example with a fresh SESSION_SECRET (skips if .env exists).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (existsSync(".env")) {
  console.log(".env already exists, leaving it as is");
} else {
  const env = readFileSync(".env.example", "utf8").replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${randomBytes(32).toString("hex")}"`);
  writeFileSync(".env", env);
  console.log("Created .env");
}
