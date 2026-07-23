import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const names = ["context", "repo", "quality"];
const pillars = new Map(names.map((name) => [name, parse(name)]));
const requiredHeadings = [
  "Scope",
  "Context",
  "Decisions",
  "Rules",
  "Workflows",
  "Watchouts",
  "Touchpoints",
  "Gaps",
];

for (const [name, pillar] of pillars) {
  assert.equal(pillar.frontmatter.pillar, name);
  assert.equal(pillar.frontmatter.status, "present");
  for (const heading of requiredHeadings) {
    assert.match(pillar.body, new RegExp(`^# ${heading}$`, "m"));
  }
  assert.ok(Buffer.byteLength(pillar.body) < (name === "quality" ? 16_384 : 8_192));
}

const fixtures = JSON.parse(readFileSync("tests/pillars-routing.json", "utf8"));
for (const fixture of fixtures) {
  assert.deepEqual(route(fixture.task), fixture.loads);
}
process.stdout.write("Pillars 1.1.0 validation passed.\n");

function route(task) {
  const loaded = new Set();
  for (const [name, pillar] of pillars) {
    if (
      pillar.frontmatter.always_load === "true" ||
      split(pillar.frontmatter.triggers).some((trigger) => matches(task, trigger))
    ) {
      loaded.add(name);
    }
  }
  for (const name of [...loaded]) {
    for (const dependency of split(pillars.get(name).frontmatter.must_read_with)) {
      if (dependency) loaded.add(dependency);
    }
  }
  return [...loaded].sort();
}

function matches(task, trigger) {
  const words = task.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const phrase = trigger.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.some((_, index) =>
    phrase.every((word, offset) => words[index + offset] === word)
  );
}

function split(value = "") {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parse(name) {
  const text = readFileSync(`agents/${name}.md`, "utf8");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]+)$/.exec(text);
  assert.ok(match, `${name} has frontmatter`);
  const frontmatter = Object.fromEntries(
    match[1].split("\n").map((line) => {
      const index = line.indexOf(":");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
  );
  return { frontmatter, body: match[2] };
}
