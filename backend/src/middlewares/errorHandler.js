const logger = require('../lib/logger');

/**
 * Middleware global de tratamento de erros
 * Captura todos os erros lançados nos controllers e services
 */
const errorHandler = (err, req, res, next) => {
    // Log completo do erro
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
    });

    // Erros de validação Zod
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Dados inválidos',
            detalhes: err.errors.map((e) => ({
                campo: e.path.join('.'),
                mensagem: e.message,
            })),
        });
    }

    // Erros do Prisma
    if (err.code === 'P2002') {
        return res.status(409).json({
            error: 'Conflito: registro duplicado',
            campo: err.meta?.target,
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: 'Registro não encontrado',
        });
    }

    // JWT expirado
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }

    // JWT inválido
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token inválido.' });
    }

    // Erros HTTP personalizados
    if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    // Erro interno do servidor (fallback)
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
        error: 'Erro interno do servidor',
        ...(isProduction ? {} : { detalhe: err.message }),
    });
};

/**
 * Classe para criar erros HTTP padronizados
 */
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}

module.exports = errorHandler;
module.exports.AppError = AppError;
