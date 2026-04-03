const jwt = require('jsonwebtoken');
const { redis } = require('../lib/redisClient');
const { AppError } = require('./errorHandler');

/**
 * Middleware de autenticação JWT
 * Verifica o token no header Authorization e injeta req.user
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Token de autenticação não fornecido', 401);
        }

        const token = authHeader.split(' ')[1];

        // Verificar se token está na blacklist (logout)
        const isBlacklisted = await redis.isTokenBlacklisted(token);
        if (isBlacklisted) {
            throw new AppError('Token inválido ou sessão encerrada', 401);
        }

        // Verificar e decodificar o token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Injetar dados do usuário na request
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            nome: decoded.nome,
        };

        // Armazenar token para possível blacklist no logout
        req.token = token;
        req.tokenExp = decoded.exp;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = authMiddleware;
