import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

function loadRootEnv(): Record<string, string> {
  const envPath = path.resolve(import.meta.dirname, "..", ".env");
  if (!existsSync(envPath)) {
    return {};
  }

  const parsed: Record<string, string> = {};
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      parsed[key] = value;
    }
  }
  return parsed;
}

export default defineConfig({
  test: {
    env: loadRootEnv(),
  },
});
