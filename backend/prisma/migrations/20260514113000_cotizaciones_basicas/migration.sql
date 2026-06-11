CREATE TYPE "TipoItemCotizacion" AS ENUM ('PRODUCTO', 'MANUAL');

CREATE TABLE "cotizaciones" (
  "id" SERIAL NOT NULL,
  "titulo" VARCHAR(180) NOT NULL,
  "cliente" VARCHAR(180),
  "obra" VARCHAR(180),
  "observaciones" TEXT,
  "dolar_referencia" DECIMAL(14,4),
  "total_usd" DECIMAL(14,4) NOT NULL,
  "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cotizacion_items" (
  "id" SERIAL NOT NULL,
  "id_cotizacion" INTEGER NOT NULL,
  "id_producto_proveedor" INTEGER,
  "tipo" "TipoItemCotizacion" NOT NULL,
  "descripcion" VARCHAR(500) NOT NULL,
  "cantidad" DECIMAL(14,4) NOT NULL,
  "unidad" VARCHAR(40),
  "precio_unitario" DECIMAL(14,4) NOT NULL,
  "moneda" "Moneda" NOT NULL,
  "total_usd" DECIMAL(14,4) NOT NULL,
  CONSTRAINT "cotizacion_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cotizaciones_creada_en_idx" ON "cotizaciones"("creada_en");
CREATE INDEX "cotizacion_items_id_cotizacion_idx" ON "cotizacion_items"("id_cotizacion");
CREATE INDEX "cotizacion_items_id_producto_proveedor_idx" ON "cotizacion_items"("id_producto_proveedor");

ALTER TABLE "cotizacion_items"
  ADD CONSTRAINT "cotizacion_items_id_cotizacion_fkey"
  FOREIGN KEY ("id_cotizacion") REFERENCES "cotizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cotizacion_items"
  ADD CONSTRAINT "cotizacion_items_id_producto_proveedor_fkey"
  FOREIGN KEY ("id_producto_proveedor") REFERENCES "productos_proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
