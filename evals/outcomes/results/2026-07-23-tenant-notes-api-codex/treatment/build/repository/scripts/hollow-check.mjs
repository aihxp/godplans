import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const files = collect("src").concat(collect("scripts"), collect("tests"));
const banned = [/\bTODO\b/, /\bFIXME\b/, /console\.log\(/, /not implemented/i];
let failed = false;
for (const file of files) {
  if (file === "scripts/hollow-check.mjs") continue;
  const text = readFileSync(file, "utf8");
  if (banned.some((pattern) => pattern.test(text))) {
    process.stderr.write(`Hollow marker found in ${file}\n`);
    failed = true;
  }
  if (file.includes("/routes") && /\.prepare\s*\(/.test(text)) {
    process.stderr.write(`SQL found in route file ${file}\n`);
    failed = true;
  }
}
if (failed) process.exitCode = 1;

function collect(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? collect(child) : [child];
  });
}
