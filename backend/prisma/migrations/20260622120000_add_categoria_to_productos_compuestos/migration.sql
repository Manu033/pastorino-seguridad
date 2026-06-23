-- Add category classification to composite products.
ALTER TABLE "productos_compuestos"
ADD COLUMN "id_categoria" INTEGER,
ADD COLUMN "id_subcategoria" INTEGER;

ALTER TABLE "productos_compuestos"
ADD CONSTRAINT "productos_compuestos_id_categoria_fkey"
FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "productos_compuestos"
ADD CONSTRAINT "productos_compuestos_id_subcategoria_fkey"
FOREIGN KEY ("id_subcategoria") REFERENCES "subcategorias"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "productos_compuestos_id_categoria_idx" ON "productos_compuestos"("id_categoria");
CREATE INDEX "productos_compuestos_id_subcategoria_idx" ON "productos_compuestos"("id_subcategoria");
