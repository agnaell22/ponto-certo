const logger = require('../lib/logger');

/**
 * Middleware de log de requisições estruturado
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration,
            userId: req.user?.id || 'anonymous',
            ip: req.ip,
            userAgent: req.get('user-agent'),
        };

        if (res.statusCode >= 500) {
            logger.error('Request Error', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('Request Warning', logData);
        } else {
            logger.info('Request', logData);
        }
    });

    next();
};

module.exports = requestLogger;
