import assert from "node:assert/strict";
import test from "node:test";
import { formatStatus } from "../src/format.js";

test("formats a healthy status", () => {
  assert.equal(formatStatus({ healthy: true }), "healthy");
});
