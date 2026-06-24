CREATE TYPE "FormulaAccesorioAutomatico" AS ENUM ('PERA', 'SOPORTE', 'ACOPLE');

ALTER TABLE "cotizacion_items"
  ADD COLUMN "metros_requeridos" DECIMAL(14,4),
  ADD COLUMN "generado_automaticamente" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "formula_automatica" "FormulaAccesorioAutomatico";

CREATE TABLE "productos_accesorios_automaticos" (
  "id" SERIAL PRIMARY KEY,
  "id_producto_tubo" INTEGER NOT NULL,
  "id_producto_accesorio" INTEGER NOT NULL,
  "formula" "FormulaAccesorioAutomatico" NOT NULL,
  "separacion_maxima_m" DECIMAL(14,4),
  "activo" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "productos_accesorios_automaticos_id_producto_tubo_fkey"
    FOREIGN KEY ("id_producto_tubo") REFERENCES "productos_proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "productos_accesorios_automaticos_id_producto_accesorio_fkey"
    FOREIGN KEY ("id_producto_accesorio") REFERENCES "productos_proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_productos_accesorios_automaticos"
  ON "productos_accesorios_automaticos"("id_producto_tubo", "id_producto_accesorio", "formula");

CREATE INDEX "productos_accesorios_automaticos_id_producto_tubo_idx"
  ON "productos_accesorios_automaticos"("id_producto_tubo");

CREATE INDEX "productos_accesorios_automaticos_id_producto_accesorio_idx"
  ON "productos_accesorios_automaticos"("id_producto_accesorio");
