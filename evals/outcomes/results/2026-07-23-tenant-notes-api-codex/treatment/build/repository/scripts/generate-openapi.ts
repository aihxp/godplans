import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { openApiDocument } from "../src/routes/contract.ts";

const path = resolve("openapi.json");
const generated = `${JSON.stringify(openApiDocument, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const existing = readFileSync(path, "utf8");
  if (existing !== generated) {
    process.stderr.write("openapi.json differs from the mounted contract.\n");
    process.exitCode = 1;
  }
} else {
  writeFileSync(path, generated);
}
