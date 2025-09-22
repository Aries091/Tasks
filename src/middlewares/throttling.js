const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');
const IORedis = require('ioredis');

const redisclient = new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    enableOfflineQueue: false,
});

const ipRateLimiter = new RateLimiterRedis({
    storeClient: redisclient,
    
    keyPrefix: 'LoginIp',
    points: 5,
    duration: 15 * 60,
    blockDuration: 60 * 60,
});

function ipThrottle(req, res, next) {
    const ip = req.ip;
    ipRateLimiter.consume(ip)
        
        .then(() => next())
        
        .catch((rej) => {
            const retrySecs = Math.round(rej.msBeforeNext / 1000) || 60 * 60;
            res.status(429).json({
                message: `Too Many Requests. Retry after ${retrySecs} seconds`,
                retryAfter: retrySecs
            });
        });
}

module.exports = ipThrottle;