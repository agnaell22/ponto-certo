-- CreateEnum
CREATE TYPE "StatusPonto" AS ENUM ('NORMAL', 'FALTA', 'ATESTADO', 'FERIADO', 'FOLGA', 'MEIO_PERIODO');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('ENTRADA', 'INICIO_INTERVALO', 'FIM_INTERVALO', 'SAIDA', 'HORA_EXTRA_INICIO', 'HORA_EXTRA_FIM', 'NOTIFICACAO_ENVIADA', 'AUTO_REGISTRO', 'AJUSTE_MANUAL', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "OrigemEvento" AS ENUM ('MANUAL', 'AUTOMATICO', 'SISTEMA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "cargo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jornadaPadraoMinutos" INTEGER NOT NULL DEFAULT 480,
    "horarioEntrada" TEXT NOT NULL DEFAULT '08:00',
    "horarioSaida" TEXT NOT NULL DEFAULT '17:00',
    "intervaloMinimoMinutos" INTEGER NOT NULL DEFAULT 60,
    "toleranciaMinutos" INTEGER NOT NULL DEFAULT 10,
    "notifAntecedenciaMin" INTEGER NOT NULL DEFAULT 15,
    "notifHoraExtraMin" INTEGER NOT NULL DEFAULT 30,
    "diasTrabalho" JSONB NOT NULL DEFAULT '[1,2,3,4,5]',
    "limiteHoraExtraDia" INTEGER NOT NULL DEFAULT 120,
    "limiteHoraSemana" INTEGER NOT NULL DEFAULT 2640,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_ponto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "entrada" TIMESTAMP(3),
    "inicioIntervalo" TIMESTAMP(3),
    "fimIntervalo" TIMESTAMP(3),
    "saida" TIMESTAMP(3),
    "horasTrabalhadasMin" INTEGER,
    "horasExtrasMin" INTEGER,
    "intervaloDuracaoMin" INTEGER,
    "status" "StatusPonto" NOT NULL DEFAULT 'NORMAL',
    "observacao" TEXT,
    "intervaloAdiado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_ponto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registroId" TEXT,
    "tipoEvento" "TipoEvento" NOT NULL,
    "origem" "OrigemEvento" NOT NULL DEFAULT 'MANUAL',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalhes" JSONB,
    "ip" TEXT,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_userId_key" ON "configuracoes"("userId");

-- CreateIndex
CREATE INDEX "registros_ponto_userId_data_idx" ON "registros_ponto"("userId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "registros_ponto_userId_data_key" ON "registros_ponto"("userId", "data");

-- CreateIndex
CREATE INDEX "logs_userId_timestamp_idx" ON "logs"("userId", "timestamp");

-- AddForeignKey
ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_ponto" ADD CONSTRAINT "registros_ponto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "registros_ponto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
