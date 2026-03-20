import { config, isDevelopment } from '@/config';
import { randomUUID } from 'node:crypto';
import pino, { type Logger, type LoggerOptions } from 'pino';
import pinoHttp from 'pino-http';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  '*.password',
  '*.accessToken',
  '*.refreshToken',
  '*.emailToken',
  '*.forgotPasswordToken'
];

const baseOptions: LoggerOptions = {
  level: config.logs.level,
  redact: { paths: redactPaths, remove: true },
  serializers: {
    err: pino.stdSerializers.err
  }
};

function createRootLogger(): Logger {
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

  return pino(baseOptions);
}

export const logger = createRootLogger();

export const httpLogger = pinoHttp({
  logger,
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
