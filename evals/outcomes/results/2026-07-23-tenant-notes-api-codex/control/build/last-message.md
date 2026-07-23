Implemented the complete offline multi-tenant Notes API.

Key deliverables:

- Node.js 22 built-in HTTP and SQLite implementation
- Secure hashed bearer-token authentication
- Tenant-scoped CRUD with symmetric isolation
- Durable migrations and idempotent initialization
- Strict validation and consistent error envelopes
- Complete [OpenAPI contract](/var/folders/7s/sfyh12m94v13w49y9fnyywyc0000gn/T/tmp.5ZrgKK1ryW/openapi.json)
- Setup and usage [documentation](/var/folders/7s/sfyh12m94v13w49y9fnyywyc0000gn/T/tmp.5ZrgKK1ryW/README.md)
- Deterministic file-backed restart, CRUD, authentication, validation, contract, and isolation tests

Verification:

- `npm test`: 12/12 passing
- All source files pass syntax checks
- Initialization and reinitialization verified
- Every note read/update/delete statement includes `organization_id`
- Loopback binding is prohibited by this evaluation sandbox, so tests automatically exercise the same HTTP handler directly here; normal environments use ephemeral loopback servers.

Run with:

```sh
npm run init
npm test
npm start
```