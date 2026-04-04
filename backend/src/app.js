const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const pontoRoutes = require('./routes/pontoRoutes');
const configRoutes = require('./routes/configRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');
const errorHandler = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/requestLogger');
const justificativaRoutes = require('./routes/justificativaRoutes');

const app = express();

// ==========================================
// Segurança
// ==========================================
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:5173';
        // Se a origem for a mesma da configuração (sem barra final), ou se for undefined (como no Postman)
        if (!origin || origin.replace(/\/$/, '') === allowedOrigin.replace(/\/$/, '')) {
            callback(null, true);
        } else {
            callback(null, allowedOrigin); // Força a origem permitida
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ==========================================
// Rate limiting global
// ==========================================
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Muitas requisições. Tente novamente em alguns minutos.',
    },
});
app.use('/api/', limiter);

// Rate limit mais rígido para auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas tentativas de autenticação. Tente em 15 minutos.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ==========================================
// Body parsing & logging
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(requestLogger);

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// Rota inicial / Teste
// ==========================================
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Ponto-Certo Backend is Online on Vercel!',
        status: 'ok'
    });
});

// Health check
// ==========================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'ponto-certo-backend',
        version: '1.0.0',
    });
});

// ==========================================
// Rotas da API
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/ponto', pontoRoutes);
app.use('/api/config', configRoutes);
app.use('/api/relatorio', relatorioRoutes);
app.use('/api/justificativa', justificativaRoutes);

// ==========================================
// 404 handler
// ==========================================
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.originalUrl,
    });
});

// ==========================================
// Error handler global (deve ser o último middleware)
// ==========================================
app.use(errorHandler);

module.exports = app;
