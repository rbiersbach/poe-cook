// logger.ts

import { FastifyBaseLogger } from "fastify";

/**
 * A no-op logger that can be used as a default for tests or when no logger is provided.
 */
export const NoopLogger: FastifyBaseLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  debug: () => {},
  trace: () => {},
  silent: () => {},
  child: () => NoopLogger,
};
