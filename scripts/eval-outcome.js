#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { writeOutcomeSummary } = require('./outcome-summary');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const options = {};
for (let index = 0; index < args.length; index++) {
  const key = args[index];
  if (key === '-h' || key === '--help') {
    process.stdout.write('Usage: node scripts/eval-outcome.js --case ID --plan-runner PATH --control-plan-runner PATH --build-runner PATH --audit-runner PATH --output DIR\n');
    process.exit(0);
  }
  if (!key.startsWith('--') || index + 1 >= args.length) throw new Error(`invalid option: ${key}`);
  options[key.slice(2)] = args[++index];
}
for (const key of ['case', 'plan-runner', 'control-plan-runner', 'build-runner', 'audit-runner', 'output']) {
  if (!options[key]) throw new Error(`--${key} is required`);
}

const caseDir = path.join(root, 'evals', 'outcomes', 'cases', options.case);
const output = path.resolve(options.output);
const input = path.join(caseDir, 'INPUT');
const request = path.join(caseDir, 'REQUEST.md');
const verify = path.join(caseDir, 'VERIFY.sh');
for (const file of [request, verify]) fs.accessSync(file, fs.constants.R_OK);
for (const key of ['plan-runner', 'control-plan-runner', 'build-runner', 'audit-runner']) {
  options[key] = path.resolve(options[key]);
  fs.accessSync(options[key], fs.constants.X_OK);
}

function run(command, commandArgs, cwd = root, stdoutFile) {
  const settings = { cwd, stdio: stdoutFile ? ['ignore', 'pipe', 'inherit'] : 'inherit' };
  const result = spawnSync(command, commandArgs, settings);
  if (stdoutFile && result.stdout) fs.writeFileSync(stdoutFile, result.stdout);
  if (result.status !== 0) throw new Error(`${path.basename(command)} exited ${result.status}`);
}

const arms = {
  treatment: { planRunner: options['plan-runner'] },
  control: { planRunner: options['control-plan-runner'] },
};
fs.mkdirSync(output, { recursive: true });

for (const [arm, config] of Object.entries(arms)) {
  const armDir = path.join(output, arm);
  const planDir = path.join(armDir, 'plan');
  const buildDir = path.join(armDir, 'build');
  const auditDir = path.join(armDir, 'audit');
  fs.mkdirSync(planDir, { recursive: true });
  run(config.planRunner, [request, path.join(planDir, 'PLAN.mdx')]);
  run(options['build-runner'], [path.join(planDir, 'PLAN.mdx'), input, buildDir]);
  const verifyLog = path.join(armDir, 'VERIFY.log');
  let verifyPassed = true;
  try {
    run(verify, [path.join(buildDir, 'repository')], root, verifyLog);
  } catch {
    verifyPassed = false;
  }
  fs.mkdirSync(auditDir, { recursive: true });
  run(options['audit-runner'], [path.join(buildDir, 'repository'), auditDir]);
  config.verifyPassed = verifyPassed;
}

writeOutcomeSummary({
  output,
  caseId: options.case,
  treatmentVerified: arms.treatment.verifyPassed,
  controlVerified: arms.control.verifyPassed,
});
process.stdout.write(`ok   ${output}\n`);
