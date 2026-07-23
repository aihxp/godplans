import type { Logger } from "./types.ts";

export function createLogger(
  sink: (line: string) => void = (line) => process.stdout.write(`${line}\n`),
): Logger {
  return {
    write(event): void {
      sink(JSON.stringify({ time: new Date().toISOString(), ...sanitize(event) }));
    },
  };
}

function sanitize(event: Record<string, unknown>): Record<string, unknown> {
  const blocked = new Set(["authorization", "token", "title", "body"]);
  return Object.fromEntries(
    Object.entries(event)
      .filter(([key]) => !blocked.has(key.toLowerCase()))
      .map(([key, value]) => [key, sanitizeValue(value)]),
  );
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string" && /^Bearer /i.test(value)) return "[REDACTED]";
  return value;
}
