-- CreateEnum
CREATE TYPE "TipoFuente" AS ENUM ('EXCEL', 'PDF', 'API', 'MANUAL');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('ARS', 'USD');

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "email_contacto" VARCHAR(255),
    "telefono" VARCHAR(80),
    "tipo_fuente" "TipoFuente" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategorias" (
    "id" SERIAL NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,

    CONSTRAINT "subcategorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "sku_interno" VARCHAR(80) NOT NULL,
    "nombre_normalizado" VARCHAR(255) NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "id_subcategoria" INTEGER,
    "marca" VARCHAR(120),
    "modelo" VARCHAR(120),
    "descripcion" TEXT,
    "imagen_url" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_proveedor" (
    "id" SERIAL NOT NULL,
    "id_proveedor" INTEGER NOT NULL,
    "id_producto" INTEGER,
    "sku_producto_proveedor" VARCHAR(120) NOT NULL,
    "nombre_producto_proveedor" VARCHAR(255) NOT NULL,
    "marca_producto_proveedor" VARCHAR(120),
    "modelo_producto_proveedor" VARCHAR(120),
    "unidad" VARCHAR(40),
    "precio_actual" DECIMAL(14,4),
    "moneda_actual" "Moneda",
    "fecha_precio_actualizada" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_precios" (
    "id" SERIAL NOT NULL,
    "id_producto_proveedor" INTEGER NOT NULL,
    "precio" DECIMAL(14,4) NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "fecha_actualizada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_precios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_nombre_key" ON "proveedores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE INDEX "subcategorias_id_categoria_idx" ON "subcategorias"("id_categoria");

-- CreateIndex
CREATE UNIQUE INDEX "subcategorias_id_categoria_nombre_key" ON "subcategorias"("id_categoria", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_interno_key" ON "productos"("sku_interno");

-- CreateIndex
CREATE INDEX "productos_nombre_normalizado_idx" ON "productos"("nombre_normalizado");

-- CreateIndex
CREATE INDEX "productos_id_categoria_idx" ON "productos"("id_categoria");

-- CreateIndex
CREATE INDEX "productos_id_subcategoria_idx" ON "productos"("id_subcategoria");

-- CreateIndex
CREATE INDEX "productos_proveedor_id_proveedor_idx" ON "productos_proveedor"("id_proveedor");

-- CreateIndex
CREATE INDEX "productos_proveedor_id_producto_idx" ON "productos_proveedor"("id_producto");

-- CreateIndex
CREATE INDEX "productos_proveedor_sku_producto_proveedor_idx" ON "productos_proveedor"("sku_producto_proveedor");

-- CreateIndex
CREATE UNIQUE INDEX "productos_proveedor_id_proveedor_sku_producto_proveedor_key" ON "productos_proveedor"("id_proveedor", "sku_producto_proveedor");

-- CreateIndex
CREATE INDEX "historial_precios_id_producto_proveedor_idx" ON "historial_precios"("id_producto_proveedor");

-- CreateIndex
CREATE INDEX "historial_precios_fecha_actualizada_idx" ON "historial_precios"("fecha_actualizada");

-- AddForeignKey
ALTER TABLE "subcategorias" ADD CONSTRAINT "subcategorias_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_subcategoria_fkey" FOREIGN KEY ("id_subcategoria") REFERENCES "subcategorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_proveedor" ADD CONSTRAINT "productos_proveedor_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_proveedor" ADD CONSTRAINT "productos_proveedor_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_id_producto_proveedor_fkey" FOREIGN KEY ("id_producto_proveedor") REFERENCES "productos_proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
