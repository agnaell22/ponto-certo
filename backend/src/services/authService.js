const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const userRepository = require('../repositories/userRepository');
const configRepository = require('../repositories/configRepository');
const logRepository = require('../repositories/logRepository');
const { redis } = require('../lib/redisClient');
const { AppError } = require('../middlewares/errorHandler');

// Schemas de validação
const registerSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
    email: z.string().email('Email inválido'),
    senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    cargo: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    senha: z.string().min(1, 'Senha é obrigatória'),
});

const authService = {
    /**
     * Gera par de tokens (access + refresh)
     */
    generateTokens(user) {
        const payload = { sub: user.id, email: user.email, nome: user.nome };

        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        });

        const refreshToken = jwt.sign(
            { sub: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        );

        return { accessToken, refreshToken };
    },

    /**
     * Registrar novo usuário
     */
    async register(data, ip) {
        // Validar entrada
        const validated = registerSchema.parse(data);

        // Verificar email duplicado
        const emailExiste = await userRepository.emailExists(validated.email);
        if (emailExiste) {
            throw new AppError('Email já cadastrado', 409);
        }

        // Hash da senha (custo 12 para produção)
        const senhaHash = await bcrypt.hash(validated.senha, 12);

        // Criar usuário
        const user = await userRepository.create({ ...validated, senha: senhaHash });

        // Criar configuração padrão
        await configRepository.createDefault(user.id);

        // Log de registro
        await logRepository.create({
            userId: user.id,
            tipoEvento: 'LOGIN',
            origem: 'MANUAL',
            detalhes: { acao: 'registro' },
            ip,
        });

        // Gerar tokens
        const { accessToken, refreshToken } = this.generateTokens(user);

        // Salvar refresh token no Redis (7 dias)
        await redis.saveRefreshToken(user.id, refreshToken, 7 * 24 * 3600);

        return {
            user: { id: user.id, nome: user.nome, email: user.email, cargo: user.cargo },
            accessToken,
            refreshToken,
        };
    },

    /**
     * Login
     */
    async login(data, ip) {
        const validated = loginSchema.parse(data);

        // Buscar usuário (inclui senha para comparação)
        const user = await userRepository.findByEmail(validated.email);
        if (!user) {
            throw new AppError('Credenciais inválidas', 401);
        }

        if (!user.ativo) {
            throw new AppError('Conta desativada. Entre em contato com o administrador.', 403);
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(validated.senha, user.senha);
        if (!senhaValida) {
            throw new AppError('Credenciais inválidas', 401);
        }

        // Gerar tokens
        const { accessToken, refreshToken } = this.generateTokens(user);

        // Salvar refresh token no Redis
        await redis.saveRefreshToken(user.id, refreshToken, 7 * 24 * 3600);

        // Log de login
        await logRepository.create({
            userId: user.id,
            tipoEvento: 'LOGIN',
            origem: 'MANUAL',
            detalhes: { acao: 'login' },
            ip,
        });

        return {
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                cargo: user.cargo,
                configuracao: user.configuracao,
            },
            accessToken,
            refreshToken,
        };
    },

    /**
     * Refresh token
     */
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw new AppError('Refresh token não fornecido', 401);
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch {
            throw new AppError('Refresh token inválido ou expirado', 401);
        }

        // Verificar se token salvo no Redis é o mesmo (rotação de tokens)
        const storedToken = await redis.getRefreshToken(decoded.sub);
        if (!storedToken || storedToken !== refreshToken) {
            // Possível reutilização de token — revogar todos
            await redis.removeRefreshToken(decoded.sub);
            throw new AppError('Token inválido. Faça login novamente.', 401);
        }

        const user = await userRepository.findById(decoded.sub);
        if (!user || !user.ativo) {
            throw new AppError('Usuário não encontrado ou inativo', 401);
        }

        const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

        // Rotacionar refresh token
        await redis.saveRefreshToken(user.id, newRefreshToken, 7 * 24 * 3600);

        return { accessToken, refreshToken: newRefreshToken };
    },

    /**
     * Logout — invalida tokens
     */
    async logout(userId, accessToken, tokenExp) {
        // Adicionar access token à blacklist pelo tempo restante
        const ttl = Math.max(0, tokenExp - Math.floor(Date.now() / 1000));
        if (ttl > 0) {
            await redis.blacklistToken(accessToken, ttl);
        }

        // Remover refresh token
        await redis.removeRefreshToken(userId);

        await logRepository.create({
            userId,
            tipoEvento: 'LOGOUT',
            origem: 'MANUAL',
        });
    },

    /**
     * Retornar perfil do usuário autenticado
     */
    async getProfile(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }
        return user;
    },
};

module.exports = authService;
