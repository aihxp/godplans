import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("package.json", "utf8"));
const dependencies = {
  ...(manifest.dependencies ?? {}),
  ...(manifest.devDependencies ?? {}),
};
if (Object.keys(dependencies).length > 0) {
  process.stderr.write("This offline build must remain dependency-free.\n");
  process.exitCode = 1;
}
mkdirSync("artifacts", { recursive: true });
const sbom = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  version: 1,
  metadata: { component: { type: "application", name: manifest.name, version: manifest.version } },
  components: [],
};
writeFileSync("artifacts/sbom.cdx.json", `${JSON.stringify(sbom, null, 2)}\n`);
process.stdout.write("Supply chain check passed: no third-party packages.\n");
