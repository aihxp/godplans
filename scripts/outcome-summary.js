#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readRunnerUsage(file) {
  if (!fs.existsSync(file)) {
    return {
      usage_source: 'unavailable',
      input_tokens: null,
      cached_input_tokens: null,
      output_tokens: null,
      total_tokens: null,
    };
  }
  const metadata = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    metadata[line.slice(0, separator)] = line.slice(separator + 1);
  }
  const number = (key) => {
    const value = Number(metadata[key]);
    return Number.isFinite(value) ? value : null;
  };
  return {
    usage_source: metadata.usage_source || 'unavailable',
    input_tokens: number('input_tokens'),
    cached_input_tokens: number('cached_input_tokens'),
    output_tokens: number('output_tokens'),
    total_tokens: number('total_tokens'),
  };
}

function auditSummary(output, arm, verifyPassed) {
  const audit = JSON.parse(fs.readFileSync(path.join(output, arm, 'audit', 'AUDIT.json'), 'utf8'));
  const active = (audit.findings || []).filter((finding) => ['open', 'accepted-risk'].includes(finding.status));
  const critical = active.filter((finding) => finding.severity === 'Critical').length;
  const high = active.filter((finding) => finding.severity === 'High').length;
  const planUsage = readRunnerUsage(path.join(output, arm, 'plan', 'RUNNER.txt'));
  const buildUsage = readRunnerUsage(path.join(output, arm, 'build', 'RUNNER.txt'));
  const totalTokens = planUsage.total_tokens !== null && buildUsage.total_tokens !== null
    ? planUsage.total_tokens + buildUsage.total_tokens
    : null;
  return {
    verify_passed: verifyPassed,
    critical,
    high,
    critical_or_high: critical + high,
    all_active_findings: active.length,
    engine_version: audit.audit?.engine_version || null,
    pack_version: audit.audit?.pack_version || null,
    verdict: audit.computed?.overall?.verdict || audit.computed?.verdict || null,
    usage: {
      plan: planUsage,
      build: buildUsage,
      reported_total_tokens: totalTokens,
    },
  };
}

function formatNumber(value) {
  return value === null ? 'unavailable' : value.toLocaleString('en-US');
}

function writeOutcomeSummary({ output, caseId, treatmentVerified, controlVerified }) {
  const treatment = auditSummary(output, 'treatment', treatmentVerified);
  const control = auditSummary(output, 'control', controlVerified);
  if (treatment.engine_version !== control.engine_version || treatment.pack_version !== control.pack_version) {
    throw new Error('audit engine or pack versions differ between arms');
  }
  const reportedTokenDelta = treatment.usage.reported_total_tokens !== null
    && control.usage.reported_total_tokens !== null
    ? treatment.usage.reported_total_tokens - control.usage.reported_total_tokens
    : null;
  const summary = {
    format: 'godplans/build-outcome@1',
    case: caseId,
    treatment,
    control,
    critical_or_high_delta: treatment.critical_or_high - control.critical_or_high,
    reported_total_token_delta: reportedTokenDelta,
    treatment_better: treatment.verify_passed && treatment.critical_or_high < control.critical_or_high,
  };
  fs.writeFileSync(path.join(output, 'SUMMARY.json'), `${JSON.stringify(summary, null, 2)}\n`);
  const markdown = [
    `# Build-outcome evaluation: ${caseId}`,
    '',
    '| Arm | Verify | Critical | High | Critical plus High | All active findings |',
    '|---|---|---:|---:|---:|---:|',
    `| treatment | ${treatment.verify_passed ? 'pass' : 'fail'} | ${treatment.critical} | ${treatment.high} | ${treatment.critical_or_high} | ${treatment.all_active_findings} |`,
    `| control | ${control.verify_passed ? 'pass' : 'fail'} | ${control.critical} | ${control.high} | ${control.critical_or_high} | ${control.all_active_findings} |`,
    '',
    `Critical plus High delta (treatment minus control): ${summary.critical_or_high_delta}.`,
    '',
    '| Arm | Plan tokens | Build tokens | Reported total tokens |',
    '|---|---:|---:|---:|',
    `| treatment | ${formatNumber(treatment.usage.plan.total_tokens)} | ${formatNumber(treatment.usage.build.total_tokens)} | ${formatNumber(treatment.usage.reported_total_tokens)} |`,
    `| control | ${formatNumber(control.usage.plan.total_tokens)} | ${formatNumber(control.usage.build.total_tokens)} | ${formatNumber(control.usage.reported_total_tokens)} |`,
    '',
    'Token totals are cumulative CLI-reported input plus output. Cached input is retained separately in SUMMARY.json.',
    '',
  ];
  fs.writeFileSync(path.join(output, 'SUMMARY.md'), `${markdown.join('\n')}\n`);
  return summary;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--output') {
    process.stderr.write('Usage: node scripts/outcome-summary.js --output DIR\n');
    process.exit(2);
  }
  const output = path.resolve(args[1]);
  const prior = JSON.parse(fs.readFileSync(path.join(output, 'SUMMARY.json'), 'utf8'));
  writeOutcomeSummary({
    output,
    caseId: prior.case,
    treatmentVerified: prior.treatment.verify_passed,
    controlVerified: prior.control.verify_passed,
  });
  process.stdout.write(`ok   ${output}\n`);
}

module.exports = { writeOutcomeSummary };
