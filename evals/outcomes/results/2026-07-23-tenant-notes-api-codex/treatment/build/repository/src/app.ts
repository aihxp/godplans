import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { Authenticator } from "./auth.ts";
import type { AppConfig } from "./config.ts";
import { loadAppConfig } from "./config.ts";
import { AppError, toProblem } from "./errors.ts";
import { checkHealth } from "./health.ts";
import { createLogger } from "./logger.ts";
import { NoteRepository } from "./notes/repository.ts";
import { executeNotesRoute } from "./notes/routes.ts";
import { NotesService } from "./notes/service.ts";
import { openApiDocument } from "./routes/contract.ts";
import { SECURITY_HEADERS } from "./security-headers.ts";
import type { Clock, IdSource, Logger } from "./types.ts";

export type InjectOptions = {
  method: string;
  url: string;
  headers?: Record<string, string>;
  payload?: unknown;
  remoteAddress?: string;
};

export type InjectResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  json(): unknown;
};

export type AppOptions = {
  config?: AppConfig;
  clock?: Clock;
  ids?: IdSource;
  logger?: Logger;
};

export function createApp(options: AppOptions = {}) {
  const config = options.config ?? loadAppConfig();
  const clock = options.clock ?? { now: () => new Date() };
  const ids = options.ids ?? { next: () => randomUUID() };
  const logger = options.logger ?? createLogger();
  const auth = new Authenticator(config, logger, () => clock.now());
  const notes = new NotesService(new NoteRepository(), clock, ids);
  let server: Server | undefined;

  async function inject(request: InjectOptions): Promise<InjectResponse> {
    const requestId = randomUUID();
    const url = new URL(request.url, "http://127.0.0.1");
    const headers = normalizeHeaders(request.headers);
    try {
      enforceBodyLimit(request.payload);
      const publicResponse = publicRoute(request.method.toUpperCase(), url, config);
      if (publicResponse) return response(publicResponse.statusCode, publicResponse.body);
      const principal = auth.authenticate(
        headers.authorization,
        request.remoteAddress ?? "127.0.0.1",
      );
      const result = executeNotesRoute(
        notes,
        {
          method: request.method.toUpperCase(),
          pathname: url.pathname,
          query: url.searchParams,
          payload: request.payload,
        },
        principal,
      );
      if (!result) throw new AppError(404, "ROUTE_NOT_FOUND", "The route does not exist.");
      logger.write({
        requestId,
        actor: principal.userId,
        organization: principal.organizationId,
        action: result.action,
        target: result.target,
        outcome: "success",
      });
      return response(result.statusCode, result.body);
    } catch (error) {
      const problem = toProblem(error, url.pathname);
      logger.write({ requestId, event: "request_denied", code: problem.code, outcome: "denied" });
      return response(problem.status, problem, "application/problem+json");
    }
  }

  async function listen(port = 3000, host = "127.0.0.1"): Promise<string> {
    if (server) throw new Error("Application is already listening");
    server = createServer(async (request, nativeResponse) => {
      let result: InjectResponse;
      try {
        const payload = await readBody(request);
        result = await inject({
          method: request.method ?? "GET",
          url: request.url ?? "/",
          headers: Object.fromEntries(
            Object.entries(request.headers).flatMap(([key, value]) =>
              typeof value === "string" ? [[key, value]] : []),
          ),
          ...(payload === undefined ? {} : { payload }),
          remoteAddress: request.socket.remoteAddress ?? "unknown",
        });
      } catch (error) {
        const problem = toProblem(error, request.url ?? "/");
        result = response(problem.status, problem, "application/problem+json");
      }
      nativeResponse.writeHead(result.statusCode, result.headers);
      nativeResponse.end(result.body);
    });
    await new Promise<void>((resolve) => server?.listen(port, host, resolve));
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    return `http://${host}:${actualPort}`;
  }

  async function close(): Promise<void> {
    if (!server) return;
    const current = server;
    server = undefined;
    await new Promise<void>((resolve, reject) =>
      current.close((error) => error ? reject(error) : resolve())
    );
  }

  return { inject, listen, close };
}

function publicRoute(method: string, url: URL, config: AppConfig) {
  if (method === "GET" && url.pathname === "/openapi.json") {
    return { statusCode: 200, body: openApiDocument };
  }
  if (method === "GET" && url.pathname === "/healthz") {
    if (checkHealth(config)) {
      return { statusCode: 200, body: { status: "ok", stores: 2 } };
    }
    throw new AppError(503, "STORE_UNAVAILABLE", "A configured store is unavailable.");
  }
  return undefined;
}

function response(
  statusCode: number,
  body?: unknown,
  contentType = "application/json",
): InjectResponse {
  const text = body === undefined ? "" : JSON.stringify(body);
  return {
    statusCode,
    headers: {
      ...SECURITY_HEADERS,
      "content-type": contentType,
    },
    body: text,
    json: () => JSON.parse(text),
  };
}

function normalizeHeaders(headers?: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
  );
}

function enforceBodyLimit(payload: unknown): void {
  if (payload !== undefined && Buffer.byteLength(JSON.stringify(payload)) > 16 * 1024) {
    throw new AppError(413, "PAYLOAD_TOO_LARGE", "Request bodies are limited to 16 KiB.");
  }
}

async function readBody(request: import("node:http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let length = 0;
  let isTooLarge = false;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    length += buffer.length;
    if (length > 16 * 1024) isTooLarge = true;
    if (!isTooLarge) chunks.push(buffer);
  }
  if (isTooLarge) {
    throw new AppError(413, "PAYLOAD_TOO_LARGE", "Request bodies are limited to 16 KiB.");
  }
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new AppError(400, "INVALID_JSON", "The request body must be valid JSON.");
  }
}
