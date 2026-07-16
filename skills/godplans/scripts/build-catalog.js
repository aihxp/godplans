#!/usr/bin/env node
'use strict';

// The validator embeds `my %catalog_max = (...)` so it stays a single portable
// file. That block is DERIVED from the reference modules, not hand-maintained:
// this regenerates it (or verifies it with --check) using the same extraction
// the regression suite uses. Adding a requirement never desyncs the validator.
// Run: node skills/godplans/scripts/build-catalog.js  (npm run catalog)

const fs = require('node:fs');
const path = require('node:path');

const skillRoot = path.resolve(__dirname, '..');
const referencesDir = path.join(skillRoot, 'references');
const validatorPath = path.join(skillRoot, 'scripts/validate-plan.sh');
const check = process.argv.includes('--check');

// Extraction mirrors tests/validate-plan.sh: within a `## Plan requirements`
// section, collect R-<PREFIX>-<N>; every prefix must be contiguous 1..max.
const seen = {};
for (const file of fs.readdirSync(referencesDir).filter((name) => name.endsWith('.md'))) {
  const lines = fs.readFileSync(path.join(referencesDir, file), 'utf8').split(/\r?\n/);
  let inside = false;
  for (const line of lines) {
    if (/^## Plan requirements\s*$/.test(line)) { inside = true; continue; }
    if (inside && /^## /.test(line)) { inside = false; }
    if (!inside) continue;
    for (const m of line.matchAll(/R-([A-Z][A-Z0-9-]*)-([0-9]+)/g)) {
      (seen[m[1]] ||= new Set()).add(Number(m[2]));
    }
  }
}

const errors = [];
const maxima = {};
for (const prefix of Object.keys(seen)) {
  const numbers = [...seen[prefix]].sort((a, b) => a - b);
  const max = numbers[numbers.length - 1];
  if (numbers.length !== max) errors.push(`${prefix}: gap in requirement ids (have ${numbers.length}, max ${max})`);
  maxima[prefix] = max;
}
if (errors.length) {
  process.stderr.write(`Requirement id gaps:\n  ${errors.join('\n  ')}\n`);
  process.exit(1);
}

const block = `my %catalog_max = (\n${Object.keys(maxima).sort().map((p) => `    ${p} => ${maxima[p]},`).join('\n')}\n);`;
const validator = fs.readFileSync(validatorPath, 'utf8');
const rebuilt = validator.replace(/my %catalog_max = \([^)]*\);/, block);

if (check) {
  if (validator === rebuilt) {
    process.stdout.write('Validator catalog is fresh.\n');
  } else {
    process.stderr.write('Validator catalog is stale. To fix: run `npm run catalog`.\n');
    process.exitCode = 1;
  }
} else if (validator === rebuilt) {
  process.stdout.write('Validator catalog already fresh.\n');
} else {
  fs.writeFileSync(validatorPath, rebuilt);
  process.stdout.write(`Rewrote %catalog_max in validate-plan.sh (${Object.keys(maxima).length} prefixes).\n`);
}
