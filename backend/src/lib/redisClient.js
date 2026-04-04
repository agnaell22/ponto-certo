const logger = require('./logger');

// =============================================
// Mock Redis em Memória (Para Vercel / Produção sem Redis)
// =============================================
class InMemoryRedis {
    constructor() {
        this.store = new Map();
        this.timers = new Map();
    }

    async connect() {
        logger.info('Redis Mock em memória inicializado (Vercel mode)');
    }

    disconnect() {
        this.store.clear();
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
    }

    async set(key, value) {
        this.store.set(key, value);
    }

    async setex(key, ttl, value) {
        this.store.set(key, value);
        // Limpar timer anterior se existir
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }
        const timer = setTimeout(() => {
            this.store.delete(key);
            this.timers.delete(key);
        }, ttl * 1000);
        this.timers.set(key, timer);
    }

    async get(key) {
        return this.store.get(key) || null;
    }

    async del(key) {
        this.store.delete(key);
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
    }

    async exists(key) {
        return this.store.has(key) ? 1 : 0;
    }
}

// =============================================
// Cliente Real (ioredis) para desenvolvimento local
// =============================================
let redisClient = null;

const isVercel = !!(process.env.VERCEL);
const hasRedisUrl = !!(process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost'));

const getRedisClient = () => {
    if (!redisClient) {
        if (isVercel || !hasRedisUrl) {
            // Vercel ou sem Redis externo: usar mock em memória
            redisClient = new InMemoryRedis();
            logger.info('Usando Redis Mock em memória');
        } else {
            // Desenvolvimento / servidor com Redis real
            const Redis = require('ioredis');
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            const isSsl = redisUrl.startsWith('rediss://');

            const redisOptions = {
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
                lazyConnect: true,
                retryStrategy(times) {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            };

            if (isSsl) {
                redisOptions.tls = {
                    rejectUnauthorized: false
                };
            }

            redisClient = new Redis(redisUrl, redisOptions);

            redisClient.on('connect', () => {
                logger.info('Redis conectado com sucesso');
            });

            redisClient.on('error', (err) => {
                logger.error('Redis erro de conexão:', err.message);
            });
        }
    }
    return redisClient;
};

// Helpers para uso comum
const redisHelpers = {
    async set(key, value, ttlSeconds = 3600) {
        const client = getRedisClient();
        const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
        if (ttlSeconds > 0) {
            await client.setex(key, ttlSeconds, serialized);
        } else {
            await client.set(key, serialized);
        }
    },

    async get(key) {
        const client = getRedisClient();
        const data = await client.get(key);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    },

    async del(key) {
        const client = getRedisClient();
        await client.del(key);
    },

    async exists(key) {
        const client = getRedisClient();
        const result = await client.exists(key);
        return result === 1;
    },

    async blacklistToken(token, ttlSeconds) {
        await this.set(`blacklist:${token}`, '1', ttlSeconds);
    },

    async isTokenBlacklisted(token) {
        return await this.exists(`blacklist:${token}`);
    },

    async saveRefreshToken(userId, token, ttlSeconds) {
        await this.set(`refresh:${userId}`, token, ttlSeconds);
    },

    async getRefreshToken(userId) {
        return await this.get(`refresh:${userId}`);
    },

    async removeRefreshToken(userId) {
        await this.del(`refresh:${userId}`);
    },

    jornadaCacheKey(userId, data) {
        return `jornada:${userId}:${data}`;
    },
};

module.exports = { getRedisClient, redis: redisHelpers };
