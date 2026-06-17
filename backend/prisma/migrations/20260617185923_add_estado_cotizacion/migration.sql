-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- AlterTable
ALTER TABLE "cotizaciones" ADD COLUMN     "estado" "EstadoCotizacion" NOT NULL DEFAULT 'PENDIENTE';

-- CreateIndex
CREATE INDEX "cotizaciones_estado_idx" ON "cotizaciones"("estado");
