import type { AppConfig } from "./config.ts";
import { getStorePaths } from "./config.ts";
import { openStore } from "./db/open-store.ts";

export function checkHealth(config: AppConfig): boolean {
  try {
    for (const path of getStorePaths(config)) {
      const database = openStore(path, { readOnly: true });
      try {
        database.prepare("SELECT 1 AS healthy").get();
      } finally {
        database.close();
      }
    }
    return true;
  } catch {
    return false;
  }
}
