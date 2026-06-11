-- ProductoProveedor pasa a ser la entidad principal de producto.
-- Se elimina la relacion opcional con productos internos y se agregan campos
-- propios para clasificacion e informacion comercial.

ALTER TABLE "productos_proveedor" DROP CONSTRAINT IF EXISTS "productos_proveedor_id_producto_fkey";

DROP INDEX IF EXISTS "productos_proveedor_id_producto_idx";

ALTER TABLE "productos_proveedor"
  DROP COLUMN IF EXISTS "id_producto",
  ADD COLUMN "id_categoria" INTEGER,
  ADD COLUMN "id_subcategoria" INTEGER,
  ADD COLUMN "descripcion" TEXT,
  ADD COLUMN "imagen_url" VARCHAR(500);

CREATE INDEX "productos_proveedor_id_categoria_idx" ON "productos_proveedor"("id_categoria");
CREATE INDEX "productos_proveedor_id_subcategoria_idx" ON "productos_proveedor"("id_subcategoria");

ALTER TABLE "productos_proveedor"
  ADD CONSTRAINT "productos_proveedor_id_categoria_fkey"
  FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "productos_proveedor"
  ADD CONSTRAINT "productos_proveedor_id_subcategoria_fkey"
  FOREIGN KEY ("id_subcategoria") REFERENCES "subcategorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP TABLE IF EXISTS "productos";
