function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid PORT environment variable: ${raw}`);
  }
  return parsed;
}

export const env = {
  databaseUrl: requireEnv("DATABASE_URL"),
  port: parsePort(process.env.PORT, 3000),
} as const;
