export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Tenant Notes API",
    version: "1.0.0",
    description: "Organization-scoped note CRUD for a local evaluator.",
  },
  servers: [{ url: "http://127.0.0.1:3000" }],
  paths: {
    "/healthz": {
      get: {
        operationId: "getHealth",
        responses: {
          "200": response("Store health", schemaRef("Health")),
          "503": problemResponse("A configured store is unavailable"),
        },
      },
    },
    "/openapi.json": {
      get: {
        operationId: "getOpenApi",
        responses: {
          "200": response("OpenAPI document", { type: "object" }),
        },
      },
    },
    "/v1/notes": {
      get: {
        operationId: "listNotes",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
          { name: "cursor", in: "query", schema: { type: "string", minLength: 1 } },
        ],
        responses: {
          "200": response("A page of notes", schemaRef("NoteList")),
          "400": problemResponse("Invalid query"),
          "401": problemResponse("Invalid bearer token"),
          "429": problemResponse("Authentication throttled"),
        },
      },
      post: {
        operationId: "createNote",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody(schemaRef("CreateNote")),
        responses: {
          "201": response("Created note", schemaRef("Note")),
          "400": problemResponse("Invalid body"),
          "401": problemResponse("Invalid bearer token"),
          "413": problemResponse("Body exceeds 16 KiB"),
          "429": problemResponse("Authentication throttled"),
        },
      },
    },
    "/v1/notes/{noteId}": {
      parameters: [{
        name: "noteId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      }],
      get: noteOperation("getNote", "200", "Note", "Read note"),
      patch: {
        ...noteOperation("updateNote", "200", "Note", "Updated note"),
        requestBody: jsonBody(schemaRef("PatchNote")),
      },
      delete: {
        operationId: "deleteNote",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": { description: "Deleted" },
          "400": problemResponse("Invalid note id"),
          "401": problemResponse("Invalid bearer token"),
          "404": problemResponse("Note absent in this organization"),
          "429": problemResponse("Authentication throttled"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "opaque" },
    },
    schemas: {
      Note: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "body",
          "ownerId",
          "organizationId",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", minLength: 1, maxLength: 200 },
          body: { type: "string", maxLength: 10000 },
          ownerId: { type: "string", format: "uuid" },
          organizationId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateNote: {
        type: "object",
        additionalProperties: false,
        required: ["title", "body"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          body: { type: "string", maxLength: 10000 },
        },
      },
      PatchNote: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          body: { type: "string", maxLength: 10000 },
        },
      },
      NoteList: {
        type: "object",
        additionalProperties: false,
        required: ["items"],
        properties: {
          items: { type: "array", items: schemaRef("Note") },
          nextCursor: { type: "string" },
        },
      },
      Health: {
        type: "object",
        additionalProperties: false,
        required: ["status", "stores"],
        properties: {
          status: { type: "string", enum: ["ok"] },
          stores: { type: "integer", enum: [2] },
        },
      },
      Problem: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "status", "detail", "instance", "code"],
        properties: {
          type: { type: "string" },
          title: { type: "string" },
          status: { type: "integer" },
          detail: { type: "string" },
          instance: { type: "string" },
          code: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              required: ["path", "message"],
              properties: {
                path: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;

function schemaRef(name: string) {
  return { $ref: `#/components/schemas/${name}` };
}

function response(description: string, schema: object) {
  return {
    description,
    content: { "application/json": { schema } },
  };
}

function problemResponse(description: string) {
  return {
    description,
    content: { "application/problem+json": { schema: schemaRef("Problem") } },
  };
}

function jsonBody(schema: object) {
  return {
    required: true,
    content: { "application/json": { schema } },
  };
}

function noteOperation(
  operationId: string,
  successStatus: string,
  schema: string,
  description: string,
) {
  return {
    operationId,
    security: [{ bearerAuth: [] }],
    responses: {
      [successStatus]: response(description, schemaRef(schema)),
      "400": problemResponse("Invalid note id or body"),
      "401": problemResponse("Invalid bearer token"),
      "404": problemResponse("Note absent in this organization"),
      "429": problemResponse("Authentication throttled"),
    },
  };
}
