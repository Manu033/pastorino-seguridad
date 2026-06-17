-- AlterTable
ALTER TABLE "proveedores" ALTER COLUMN "tipos" DROP DEFAULT;

-- CreateTable
CREATE TABLE "productos_compuestos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_compuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_compuestos_items" (
    "id" SERIAL NOT NULL,
    "id_producto_compuesto" INTEGER NOT NULL,
    "tipo" "TipoItemCotizacion" NOT NULL,
    "id_producto_proveedor" INTEGER,
    "descripcion" VARCHAR(500) NOT NULL,
    "cantidad" DECIMAL(14,4) NOT NULL,
    "unidad" VARCHAR(40),
    "precio_unitario" DECIMAL(14,4),
    "moneda" "Moneda",

    CONSTRAINT "productos_compuestos_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "productos_compuestos_nombre_key" ON "productos_compuestos"("nombre");

-- CreateIndex
CREATE INDEX "productos_compuestos_items_id_producto_compuesto_idx" ON "productos_compuestos_items"("id_producto_compuesto");

-- CreateIndex
CREATE INDEX "productos_compuestos_items_id_producto_proveedor_idx" ON "productos_compuestos_items"("id_producto_proveedor");

-- AddForeignKey
ALTER TABLE "productos_compuestos_items" ADD CONSTRAINT "productos_compuestos_items_id_producto_compuesto_fkey" FOREIGN KEY ("id_producto_compuesto") REFERENCES "productos_compuestos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_compuestos_items" ADD CONSTRAINT "productos_compuestos_items_id_producto_proveedor_fkey" FOREIGN KEY ("id_producto_proveedor") REFERENCES "productos_proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
