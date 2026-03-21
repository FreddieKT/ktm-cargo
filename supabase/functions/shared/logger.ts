import type { LoggerMeta } from './types.ts';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function serialize(value: unknown): string {
  if (value instanceof Error) {
    return JSON.stringify({
      name: value.name,
      message: value.message,
      stack: value.stack,
    });
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function write(level: LogLevel, scope: string, message: string, meta?: LoggerMeta) {
  const line = meta ? `[${scope}] ${message} ${serialize(meta)}` : `[${scope}] ${message}`;

  switch (level) {
    case 'debug':
      console.debug(line);
      break;
    case 'info':
      console.info(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
  }
}

export function createLogger(scope: string) {
  return {
    debug(message: string, meta?: LoggerMeta) {
      write('debug', scope, message, meta);
    },
    info(message: string, meta?: LoggerMeta) {
      write('info', scope, message, meta);
    },
    warn(message: string, meta?: LoggerMeta) {
      write('warn', scope, message, meta);
    },
    error(message: string, meta?: LoggerMeta) {
      write('error', scope, message, meta);
    },
  };
}

export const logger = createLogger('edge');
