-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('COLABORADOR', 'ADMIN_RH');

-- CreateEnum
CREATE TYPE "TipoJustificativa" AS ENUM ('ATESTADO_MEDICO', 'ATESTADO_ACOMPANHANTE', 'OBITO', 'CASAMENTO', 'NASCIMENTO_FILHO', 'DOACAO_SANGUE', 'ALISTAMENTO_MILITAR', 'VESTIBULAR', 'JUSTICA', 'CONVOCACAO_ELEITORAL', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusJustificativa" AS ENUM ('PENDENTE', 'EM_REVISAO', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "AcaoRH" AS ENUM ('ABONAR', 'COMPENSAR', 'DESCONTAR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoEvento" ADD VALUE 'JUSTIFICATIVA_UPLOAD';
ALTER TYPE "TipoEvento" ADD VALUE 'JUSTIFICATIVA_VALIDADA';

-- AlterTable
ALTER TABLE "registros_ponto" ADD COLUMN     "justificativaId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'COLABORADOR';

-- CreateTable
CREATE TABLE "justificativas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoJustificativa" NOT NULL,
    "motivo" TEXT NOT NULL,
    "anexoUrl" TEXT,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "status" "StatusJustificativa" NOT NULL DEFAULT 'PENDENTE',
    "acaoRH" "AcaoRH",
    "observacaoRH" TEXT,
    "confirmadoUser" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "justificativas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banco_horas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "saldoMinutos" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banco_horas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banco_horas_userId_key" ON "banco_horas"("userId");

-- AddForeignKey
ALTER TABLE "registros_ponto" ADD CONSTRAINT "registros_ponto_justificativaId_fkey" FOREIGN KEY ("justificativaId") REFERENCES "justificativas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justificativas" ADD CONSTRAINT "justificativas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banco_horas" ADD CONSTRAINT "banco_horas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
