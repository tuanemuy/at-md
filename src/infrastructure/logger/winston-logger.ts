import winston from 'winston';
import { type Logger, LogLevel, type LogMetadata } from '@/domain/shared/models/logger';

/**
 * Winston ロガーの実装
 */
export class WinstonLogger implements Logger {
  private logger: winston.Logger;

  constructor(options?: {
    level?: LogLevel;
    silent?: boolean;
  }) {
    const { level = LogLevel.INFO, silent = false } = options || {};

    this.logger = winston.createLogger({
      level,
      silent,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'at-md' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  error(message: string, metadata?: LogMetadata): void {
    this.logger.error(message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.logger.warn(message, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.logger.info(message, metadata);
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.logger.debug(message, metadata);
  }
}