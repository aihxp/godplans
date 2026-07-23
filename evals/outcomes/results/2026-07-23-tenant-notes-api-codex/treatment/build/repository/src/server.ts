import { createApp } from "./app.ts";

const port = Number(process.env.PORT ?? "3000");
const app = createApp();

await app.listen(port);
process.stdout.write(`Tenant Notes API listening on http://127.0.0.1:${port}\n`);

async function shutdown(): Promise<void> {
  await app.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
