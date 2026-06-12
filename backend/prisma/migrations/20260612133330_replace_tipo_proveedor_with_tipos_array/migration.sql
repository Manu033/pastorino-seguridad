-- Add new tipos array column (nullable while we migrate data)
ALTER TABLE "proveedores" ADD COLUMN "tipos" "TipoCotizacion"[];

-- Migrate existing data
UPDATE "proveedores" SET "tipos" = ARRAY['EXTINCION'::"TipoCotizacion"] WHERE "tipo" = 'EXTINCION';
UPDATE "proveedores" SET "tipos" = ARRAY['DETECCION'::"TipoCotizacion"] WHERE "tipo" = 'DETECCION';
UPDATE "proveedores" SET "tipos" = ARRAY['EXTINCION'::"TipoCotizacion", 'DETECCION'::"TipoCotizacion"] WHERE "tipo" = 'AMBOS';

-- Set NOT NULL now that data is populated
ALTER TABLE "proveedores" ALTER COLUMN "tipos" SET NOT NULL;
ALTER TABLE "proveedores" ALTER COLUMN "tipos" SET DEFAULT '{}';

-- Drop old column and enum
ALTER TABLE "proveedores" DROP COLUMN "tipo";
DROP TYPE "TipoProveedor";
