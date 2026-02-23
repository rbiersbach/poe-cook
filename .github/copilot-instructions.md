# Copilot Instructions

## Logging and Error Handling (Backend)
- Use Fastify’s logger (`fastify.log`) for all application logging in production code.
- For shared code and tests, use the project’s `LoggerLike` interface (see logger.ts) as the base logger type.
- Do not use `console.log`, `console.warn`, or `console.error` for application logging.
- Log with appropriate levels: `.info`, `.warn`, `.error`.
- Always include relevant context (request body, error objects, identifiers).
- Catch errors at async boundaries, log full error details, and return user-friendly API errors.
- Pass logger instance to classes/services via constructor or method parameter (no global/static logging).
- In tests, use `NoopLogger` (from logger.ts) or a mock logger to avoid actual log output.

## Agent/Service Classes
- Accept logger instance in constructor:
  `constructor(private logger: LoggerLike) {}`

## Root-based Imports
- Use root-based imports for local modules (e.g., `import tradeClient from "trade-client";`).

## Running Tests
To run tests for a specific module, use:

  npm run test -- <module>

For example, to test the backend module:

  npm run test -- backend

Replace "backend" with the desired module name to run tests for other modules.


## API Specification
Always consult and adhere to the API specification (see specs/openapi.yaml) when working with API endpoints, request/response types, or contracts. Ensure all changes, implementations, and tests are consistent with the spec.