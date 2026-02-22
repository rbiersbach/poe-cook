// logger.ts

export interface LoggerLike {
  info: (msg: string, meta?: any) => void;
  warn: (msg: string, meta?: any) => void;
  error: (meta: any, msg?: string) => void;
}

/**
 * A no-op logger that can be used as a default for tests or when no logger is provided.
 */
export const NoopLogger: LoggerLike = {
  info: () => {},
  warn: () => {},
  error: () => {},
};
