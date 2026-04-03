const authService = require('../services/authService');

const authController = {
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body, req.ip);
            res.status(201).json({ message: 'Usuário criado com sucesso', ...result });
        } catch (err) {
            next(err);
        }
    },

    async login(req, res, next) {
        try {
            const result = await authService.login(req.body, req.ip);
            res.json({ message: 'Login realizado com sucesso', ...result });
        } catch (err) {
            next(err);
        }
    },

    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);
            res.json(result);
        } catch (err) {
            next(err);
        }
    },

    async logout(req, res, next) {
        try {
            await authService.logout(req.user.id, req.token, req.tokenExp);
            res.json({ message: 'Logout realizado com sucesso' });
        } catch (err) {
            next(err);
        }
    },

    async profile(req, res, next) {
        try {
            const user = await authService.getProfile(req.user.id);
            res.json(user);
        } catch (err) {
            next(err);
        }
    },
};

module.exports = authController;
