# AGENTS.md

## Logging and Error Handling Conventions

### Logging
- The backend uses Fastify's built-in logger (`fastify.log`) for all logging, including warnings and errors.
- Do **not** use `console.log`, `console.warn`, or `console.error` for application logging.
- Use the appropriate log level:
  - `fastify.log.info(message, meta)` for informational messages
  - `fastify.log.warn(message, meta)` for warnings
  - `fastify.log.error(meta, message)` for errors
- Always include relevant context (such as request body, error objects, or identifiers) in the log metadata.

**Example:**
```ts
fastify.log.warn("Invalid TradeSearchRequest: missing query or sort", { body: request.body });
fastify.log.error({ error: err, body: request.body }, "Unexpected error in /api/trade-search");
```

### Error Handling
- Catch errors at the boundary of asynchronous operations (e.g., route handlers, service entry points).
- Log errors using `fastify.log.error` with both the error object and relevant context.
- Return user-friendly error messages in API responses, but log full error details for debugging.

**Example:**
```ts
try {
  // ...
} catch (err) {
  fastify.log.error({ error: err, body: request.body }, "Unexpected error in /api/trade-search");
  return reply.status(500).send({ error: "Server error" });
}
```

### Agent/Service Classes
- If a class or service needs to log, pass the logger instance (e.g., `fastify.log`) as a constructor argument or method parameter.
- Do **not** use global or static logging.
- Example constructor:
```ts
constructor(private logger: FastifyBaseLogger) {}
```

### TradeResolver Example
- Refactor `TradeResolver` to accept a logger instance and use it for all logging.
- Example usage:
```ts
this.logger.info("Fetching HTML from URL", { url });
this.logger.error({ error }, "Failed to resolve TradeSearchRequest");
```

### Root-based Imports
- The backend now supports root-based imports because the project root is specified in `package.json`.
- You can import modules using their filename without `./`, e.g. `import tradeClient from "trade-client";` instead of `import tradeClient from "./trade-client";`.
- This applies to all local modules in the backend. Update imports accordingly for consistency and clarity.
