const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning:', e.message);
});

prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e.message);
});

module.exports = prisma;
