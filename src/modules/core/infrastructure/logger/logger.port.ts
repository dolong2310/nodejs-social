export interface LoggerPort {
  info(payload: unknown, msg?: string): void;
  warn(payload: unknown, msg?: string): void;
  error(payload: unknown, msg?: string): void;
  debug(payload: unknown, msg?: string): void;

  child(context: Record<string, unknown>): LoggerPort;
}
