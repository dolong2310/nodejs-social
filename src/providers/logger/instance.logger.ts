import { config, isDevelopment } from '@/config';
import { randomUUID } from 'node:crypto';
import pino, { type Logger, type LoggerOptions } from 'pino';
import pinoHttp, { type HttpLogger } from 'pino-http';
import { RequestContextLogger } from './request-context.logger';

export class LoggerInstance {
  private static logger: Logger;
  private static httpLogger: HttpLogger;

  public static getLogger(): Logger {
    if (!this.logger) {
      this.logger = this.createRootLogger();
    }
    return this.logger;
  }

  public static getHttpLogger(): HttpLogger {
    if (!this.httpLogger) {
      this.httpLogger = this.createHttpLogger();
    }
    return this.httpLogger;
  }

  private static createRootLogger(): Logger {
    function logContextMixin(): Record<string, string> {
      const ctx = RequestContextLogger.getStore();
      if (!ctx) return {};
      const out: Record<string, string> = {};
      if (ctx.requestId) out.reqId = ctx.requestId;
      if (ctx.userId) out.userId = ctx.userId;
      return out;
    }

    const baseOptions: LoggerOptions = {
      level: config.logs.level,
      mixin: logContextMixin,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          '*.password',
          '*.accessToken',
          '*.refreshToken',
          '*.emailToken',
          '*.forgotPasswordToken'
        ],
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

  private static createHttpLogger(): HttpLogger {
    return pinoHttp({
      logger: this.getLogger(),
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
}
