import { formatStatus } from "./format.js";

const status = { healthy: true, checkedAt: "2026-07-13T12:00:00Z" };
process.stdout.write(`${formatStatus(status)}\n`);
