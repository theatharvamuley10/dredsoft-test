const morgan = require("morgan");
const config = require("../config");

/**
 * Custom Morgan token for response time in ms
 */
morgan.token("response-time-ms", (req, res) => {
  if (!req._startAt || !res._startAt) {
    return "";
  }

  const ms =
    (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;

  return ms.toFixed(2);
});

/**
 * Custom format for development
 */
const devFormat =
  ":method :url :status :response-time-ms ms - :res[content-length]";

/**
 * Custom format for production
 */
const prodFormat = ":remote-addr - :method :url :status :response-time-ms ms";

/**
 * Create logger based on environment
 */
const createLogger = () => {
  if (config.isProduction()) {
    return morgan(prodFormat);
  }
  return morgan(devFormat);
};

module.exports = createLogger();
