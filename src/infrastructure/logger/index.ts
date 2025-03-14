import { type Logger, LogLevel } from '@/domain/shared/models/logger';
import { WinstonLogger } from './winston-logger';

/**
 * 環境変数からログレベルを取得
 */
function getLogLevelFromEnv(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  
  switch (level) {
    case 'error':
      return LogLevel.ERROR;
    case 'warn':
      return LogLevel.WARN;
    case 'info':
      return LogLevel.INFO;
    case 'debug':
      return LogLevel.DEBUG;
    default:
      return LogLevel.INFO;
  }
}

/**
 * グローバルロガーインスタンス
 */
let globalLogger: Logger;

/**
 * グローバルロガーの初期化
 */
export function initLogger(options?: {
  level?: LogLevel;
  silent?: boolean;
}): Logger {
  const level = options?.level || getLogLevelFromEnv();
  const silent = options?.silent || process.env.NODE_ENV === 'test';
  
  globalLogger = new WinstonLogger({ level, silent });
  return globalLogger;
}

/**
 * グローバルロガーの取得
 * 初期化されていない場合は自動的に初期化
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    return initLogger();
  }
  return globalLogger;
}

// デフォルトエクスポート
export default getLogger(); 