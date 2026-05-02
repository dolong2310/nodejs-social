import { appConfig } from '@/bootstrap/config/app.config';
import { isDevelopment } from '@/bootstrap/config/env.config';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { randomUUID } from 'node:crypto';
import pino, { type Logger as PinoLogger, type LoggerOptions as PinoLoggerOptions } from 'pino';
import pinoHttp, { type HttpLogger as PinoHttpLogger } from 'pino-http';

interface ILoggerGetter {
  getHttpLogger(): PinoHttpLogger;
}

class Logger implements LoggerPort, ILoggerGetter {
  private pinoLogger: PinoLogger;
  private httpLogger: PinoHttpLogger;

  constructor() {
    this.pinoLogger = this.createRootLogger();
    this.httpLogger = this.createHttpLogger(this.pinoLogger);
  }

  private createRootLogger(): PinoLogger {
    function logContextMixin(): Record<string, string> {
      const ctx = requestContextLogger.getStore();
      if (!ctx) return {};
      const out: Record<string, string> = {};
      if (ctx.requestId) out.reqId = ctx.requestId;
      if (ctx.userId) out.userId = ctx.userId;
      return out;
    }

    const baseOptions: PinoLoggerOptions = {
      level: appConfig.logs.level,
      mixin: logContextMixin,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.accessToken', '*.refreshToken'],
        remove: true
      },
      serializers: {
        err: pino.stdSerializers.err
      }
    };

    if (isDevelopment) {
      return pino({
        ...baseOptions,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        }
      });
    }

    return pino({
      ...baseOptions,
      timestamp: pino.stdTimeFunctions.isoTime
    });
  }

  private createHttpLogger(pinoLogger: PinoLogger): PinoHttpLogger {
    return pinoHttp({
      logger: pinoLogger,
      genReqId(req, res) {
        const headerId = req.headers['x-request-id'];
        const existing = typeof headerId === 'string' ? headerId : Array.isArray(headerId) ? headerId[0] : undefined;
        if (existing) return existing;
        const id = randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res
      },
      customLogLevel(_req, res, err) {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      autoLogging: {
        ignore: (req) => {
          const r = req as typeof req & { originalUrl?: string };
          const path = r.originalUrl ?? r.url ?? '';
          return path.includes('/docs');
        }
      }
    });
  }

  public info(payload: unknown, msg?: string) {
    this.pinoLogger.info(payload, msg);
  }

  public warn(payload: unknown, msg?: string) {
    this.pinoLogger.warn(payload, msg);
  }

  public error(payload: unknown, msg?: string) {
    this.pinoLogger.error(payload, msg);
  }

  public debug(payload: unknown, msg?: string) {
    this.pinoLogger.debug(payload, msg);
  }

  public child(context: Record<string, unknown>) {
    return this.pinoLogger.child(context);
  }

  public getHttpLogger(): PinoHttpLogger {
    if (!this.httpLogger) {
      this.httpLogger = this.createHttpLogger(this.pinoLogger);
    }
    return this.httpLogger;
  }
}

const logger = new Logger();
export default logger;
