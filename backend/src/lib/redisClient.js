const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

const getRedisClient = () => {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const isSsl = redisUrl.startsWith('rediss://');

        const redisOptions = {
            maxRetriesPerRequest: null, // Mantém tentando conectar sem derrubar o app
            enableReadyCheck: false,
            lazyConnect: true,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        };

        // Adiciona configuração TLS se for rediss:// (Upstash/Cloud)
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
            // Log apenas o erro, sem derrubar o processo
            logger.error('Redis erro de conexão:', err.message);
        });

        redisClient.on('close', () => {
            logger.warn('Redis conexão encerrada');
        });

        redisClient.on('reconnecting', () => {
            logger.info('Redis tentando reconectar...');
        });
    }
    return redisClient;
};

// Helpers para uso comum
const redisHelpers = {
    /**
     * Salvar dado com TTL
     * @param {string} key
     * @param {*} value
     * @param {number} ttlSeconds
     */
    async set(key, value, ttlSeconds = 3600) {
        const client = getRedisClient();
        const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
        if (ttlSeconds > 0) {
            await client.setex(key, ttlSeconds, serialized);
        } else {
            await client.set(key, serialized);
        }
    },

    /**
     * Buscar dado
     * @param {string} key
     * @returns {*}
     */
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

    /**
     * Deletar chave
     * @param {string} key
     */
    async del(key) {
        const client = getRedisClient();
        await client.del(key);
    },

    /**
     * Verificar se chave existe (para blacklist de tokens)
     * @param {string} key
     * @returns {boolean}
     */
    async exists(key) {
        const client = getRedisClient();
        const result = await client.exists(key);
        return result === 1;
    },

    /**
     * Adicionar token à blacklist (logout)
     * @param {string} token
     * @param {number} ttlSeconds - tempo restante do token
     */
    async blacklistToken(token, ttlSeconds) {
        await this.set(`blacklist:${token}`, '1', ttlSeconds);
    },

    /**
     * Verificar se token está na blacklist
     * @param {string} token
     * @returns {boolean}
     */
    async isTokenBlacklisted(token) {
        return await this.exists(`blacklist:${token}`);
    },

    /**
     * Salvar refresh token do usuário
     * @param {string} userId
     * @param {string} token
     * @param {number} ttlSeconds
     */
    async saveRefreshToken(userId, token, ttlSeconds) {
        await this.set(`refresh:${userId}`, token, ttlSeconds);
    },

    /**
     * Buscar refresh token do usuário
     * @param {string} userId
     */
    async getRefreshToken(userId) {
        return await this.get(`refresh:${userId}`);
    },

    /**
     * Remover refresh token (logout)
     * @param {string} userId
     */
    async removeRefreshToken(userId) {
        await this.del(`refresh:${userId}`);
    },

    /**
     * Cache de cálculos de jornada por dia
     * @param {string} userId
     * @param {string} data - YYYY-MM-DD
     */
    jornadaCacheKey(userId, data) {
        return `jornada:${userId}:${data}`;
    },
};

module.exports = { getRedisClient, redis: redisHelpers };
