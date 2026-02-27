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

## Imports
- Use root-based imports for local modules (e.g., `import tradeClient from "trade-client";`).
- Use the ES module import syntax instead of require.

## Running Tests
To run tests for a specific module, use:

  npm run test --workspace <module>

For example, to test the backend module:

  npm run test --workspace backend

Replace "backend" with the desired module name to run tests for other modules.


## API Specification
Always consult and adhere to the API specification (see specs/openapi.yaml) when working with API endpoints, request/response types, or contracts. Ensure all changes, implementations, and tests are consistent with the spec.

## Frontend Testing and Accessibility
- All interactive and testable elements (buttons, inputs, loaders, etc.) must include a unique `data-testid` attribute for reliable selection in tests.
- Use descriptive and consistent values for `data-testid` (e.g., `data-testid="add-input-button"`, `data-testid="loader"`).
- Make sure every style contains a respective dark mode variant (e.g., `bg-white` should have a corresponding `dark:bg-surface`).
- If a dark mode variant is missing for a style, add it to the `index.css` or relevant stylesheet to ensure the application is fully functional and visually consistent in both light and dark modes.