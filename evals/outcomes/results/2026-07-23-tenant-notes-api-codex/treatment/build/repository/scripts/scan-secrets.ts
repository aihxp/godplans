import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const candidates = collect(".").filter((path) =>
  !path.startsWith(".git/") &&
  !path.startsWith("node_modules/") &&
  !path.startsWith("dist/") &&
  !path.endsWith(".sqlite") &&
  path !== "BUILD-PLAN.md"
);
const tokenPattern = /Bearer\s+[A-Za-z0-9_-]{32,}/;
const privateKeyPattern = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
for (const path of candidates) {
  const text = readFileSync(path, "utf8");
  if (tokenPattern.test(text) || privateKeyPattern.test(text)) {
    process.stderr.write(`Possible secret in ${path}\n`);
    process.exitCode = 1;
  }
}
if (!process.exitCode) process.stdout.write("Secret scan passed.\n");

function collect(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name).replace(/^\.\//, "");
    if ([".git", "node_modules", "dist"].includes(entry.name)) return [];
    return entry.isDirectory() ? collect(child) : [child];
  });
}
