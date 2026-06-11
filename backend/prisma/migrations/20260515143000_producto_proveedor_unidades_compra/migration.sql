CREATE TYPE "RedondeoCompra" AS ENUM ('ARRIBA');

ALTER TABLE "productos_proveedor"
  ADD COLUMN "unidad_calculo" VARCHAR(40),
  ADD COLUMN "cantidad_por_unidad_compra" DECIMAL(14, 4),
  ADD COLUMN "redondeo_compra" "RedondeoCompra";
