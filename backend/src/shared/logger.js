// Small structured logger. Lambda sends console output to CloudWatch Logs,
// and JSON lines can be searched with CloudWatch Logs Insights.
// Never pass request bodies, headers, tokens or passwords to this logger.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

export function createLogger(base = {}, level = globalThis.process?.env?.LOG_LEVEL || 'info') {
  const threshold = LEVELS[level] ?? LEVELS.info;

  const write = (lvl, message, details = {}) => {
    if (LEVELS[lvl] < threshold) return;
    const line = JSON.stringify({ level: lvl, message, ...base, ...details });
    if (lvl === 'error') console.error(line);
    else if (lvl === 'warn') console.warn(line);
    else console.log(line);
  };

  return {
    debug: (m, d) => write('debug', m, d),
    info: (m, d) => write('info', m, d),
    warn: (m, d) => write('warn', m, d),
    error: (m, d) => write('error', m, d),
    child: (extra) => createLogger({ ...base, ...extra }, level),
  };
}

export const silentLogger = createLogger({}, 'silent');
