const { randomUUID } = require('crypto');

function createLogger(ctx = {}) {
  const defaults = { ...ctx };

  return {
    info(message, data = {}) {
      console.log(JSON.stringify({ level: 'info', ...defaults, ...data, message }));
    },
    warn(message, data = {}) {
      console.warn(JSON.stringify({ level: 'warn', ...defaults, ...data, message }));
    },
    error(message, data = {}) {
      console.error(JSON.stringify({ level: 'error', ...defaults, ...data, message }));
    }
  };
}

function requestLogger(req, _res, next) {
  const requestId = randomUUID();
  req.requestId = requestId;
  req.log = createLogger({ requestId, method: req.method, path: req.path });
  next();
}

module.exports = { createLogger, requestLogger };
