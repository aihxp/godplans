import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

const checked = new Set([".ts", ".mjs", ".json", ".md", ".sql"]);
const files = [".", "src", "scripts", "tests", "config", "agents", "docs"]
  .flatMap((path) => collect(path))
  .filter((path) => checked.has(extname(path)) && !path.includes("node_modules"));
let failed = false;
for (const file of new Set(files)) {
  const text = readFileSync(file, "utf8");
  if (!text.endsWith("\n") || /[ \t]+\n/.test(text) || text.includes("\t")) {
    process.stderr.write(`Formatting violation: ${file}\n`);
    failed = true;
  }
}
if (failed) process.exitCode = 1;

function collect(path) {
  try {
    return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
      if ([".git", "node_modules", "dist"].includes(entry.name)) return [];
      const child = join(path, entry.name);
      return entry.isDirectory() ? collect(child) : [child];
    });
  } catch {
    return [];
  }
}
