-- CreateEnum
CREATE TYPE "TipoProveedor" AS ENUM ('DETECCION', 'EXTINCION', 'AMBOS');

-- AlterTable
ALTER TABLE "proveedores" ADD COLUMN     "tipo" "TipoProveedor" NOT NULL DEFAULT 'AMBOS';
