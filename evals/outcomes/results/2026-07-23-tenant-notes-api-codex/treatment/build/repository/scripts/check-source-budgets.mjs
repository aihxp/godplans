import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

let failed = false;
for (const file of collect("src").concat(collect("scripts"))) {
  if (!file.endsWith(".ts") && !file.endsWith(".mjs")) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  if (lines.length > 400) fail(`${file} exceeds 400 lines`);
  let depth = 0;
  for (const line of lines) {
    depth += (line.match(/{/g) ?? []).length;
    depth -= (line.match(/}/g) ?? []).length;
    if (depth > 8) fail(`${file} has excessive structural nesting`);
  }
}
if (failed) process.exitCode = 1;

function fail(message) {
  process.stderr.write(`${message}\n`);
  failed = true;
}

function collect(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? collect(child) : [child];
  });
}
