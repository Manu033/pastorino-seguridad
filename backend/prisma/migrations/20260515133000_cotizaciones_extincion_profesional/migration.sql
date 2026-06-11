CREATE TYPE "TipoCotizacion" AS ENUM ('EXTINCION', 'DETECCION');

ALTER TABLE "cotizaciones"
  ADD COLUMN "tipo" "TipoCotizacion" NOT NULL DEFAULT 'EXTINCION',
  ADD COLUMN "costo_directo_usd" DECIMAL(14, 4) NOT NULL DEFAULT 0,
  ADD COLUMN "porcentaje_utilidad" DECIMAL(8, 4) NOT NULL DEFAULT 0,
  ADD COLUMN "monto_utilidad_usd" DECIMAL(14, 4) NOT NULL DEFAULT 0,
  ADD COLUMN "subtotal_usd" DECIMAL(14, 4) NOT NULL DEFAULT 0,
  ADD COLUMN "aplica_costos_varios" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "porcentaje_costos_varios" DECIMAL(8, 4) NOT NULL DEFAULT 0,
  ADD COLUMN "monto_costos_varios_usd" DECIMAL(14, 4) NOT NULL DEFAULT 0;

UPDATE "cotizaciones"
SET
  "costo_directo_usd" = "total_usd",
  "subtotal_usd" = "total_usd";

CREATE INDEX "cotizaciones_tipo_idx" ON "cotizaciones"("tipo");
