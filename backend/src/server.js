require('dotenv').config();
const app = require('./app');
const { getRedisClient } = require('./lib/redisClient');
const prisma = require('./lib/prismaClient');
const logger = require('./lib/logger');
const notificacaoService = require('./services/notificacaoService');

const PORT = process.env.PORT || 3001;

async function bootstrap() {
    try {
        // Conectar ao banco de dados
        await prisma.$connect();
        logger.info('Banco de dados PostgreSQL conectado');

        // Conectar ao Redis
        const redis = getRedisClient();
        await redis.connect();
        logger.info('Redis conectado');

        // Iniciar agendador de notificações
        notificacaoService.agendarNotificacoes();
        logger.info('Agendador de notificações iniciado');

        // Iniciar servidor HTTP
        const server = app.listen(PORT, () => {
            logger.info(`Servidor Ponto-Certo rodando na porta ${PORT}`);
            logger.info(`Ambiente: ${process.env.NODE_ENV}`);
        });

        // Graceful shutdown
        const shutdown = async (signal) => {
            logger.info(`Recebido sinal ${signal}. Encerrando graciosamente...`);
            server.close(async () => {
                await prisma.$disconnect();
                redis.disconnect();
                logger.info('Servidor encerrado com sucesso');
                process.exit(0);
            });

            // Forçar encerramento após 10s
            setTimeout(() => {
                logger.error('Forçando encerramento após timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('UnhandledRejection:', { reason, promise });
        });

        process.on('uncaughtException', (error) => {
            logger.error('UncaughtException:', error);
            process.exit(1);
        });

    } catch (error) {
        logger.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

bootstrap();
