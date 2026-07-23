import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const files = collect("src").concat(collect("scripts"), collect("tests"));
for (const file of files.filter((item) => item.endsWith(".ts"))) {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--check", file],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exitCode = 1;
  }
}

function collect(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? collect(child) : [child];
  });
}
