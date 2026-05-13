import type { PrismaClient } from "@prisma/client";
import type { FilaImportacionNormalizada } from "../schemas/importacion.js";

type ImportacionResultado = {
  proveedor_id: number;
  filas_procesadas: number;
  productos_creados: number;
  productos_actualizados: number;
  precios_creados: number;
  errores: string[];
};

export async function processImportacionJson(
  prisma: PrismaClient,
  proveedorId: number,
  rows: FilaImportacionNormalizada[],
): Promise<ImportacionResultado> {
  return prisma.$transaction(async (tx) => {
    const proveedor = await tx.proveedor.findUnique({ where: { id: proveedorId } });
    if (!proveedor) {
      throw new Error("Proveedor no encontrado");
    }

    let productos_creados = 0;
    let productos_actualizados = 0;
    let precios_creados = 0;

    for (const row of rows) {
      const actual = await tx.productoProveedor.findUnique({
        where: {
          uq_productos_proveedor_proveedor_sku: {
            id_proveedor: proveedorId,
            sku_producto_proveedor: row.sku_producto_proveedor,
          },
        },
      });

      const now = new Date();
      const data = {
        nombre_producto_proveedor: row.nombre_producto_proveedor,
        marca_producto_proveedor: row.marca_producto_proveedor,
        modelo_producto_proveedor: row.modelo_producto_proveedor,
        unidad: row.unidad,
        precio_actual: row.precio,
        moneda_actual: row.moneda,
        fecha_precio_actualizada: now,
        activo: true,
      };

      const producto = actual
        ? await tx.productoProveedor.update({
            where: { id: actual.id },
            data,
          })
        : await tx.productoProveedor.create({
            data: {
              id_proveedor: proveedorId,
              id_producto: null,
              sku_producto_proveedor: row.sku_producto_proveedor,
              ...data,
            },
          });

      if (actual) {
        productos_actualizados += productoChanged(actual, data) ? 1 : 0;
      } else {
        productos_creados += 1;
      }

      await tx.historialPrecio.create({
        data: {
          id_producto_proveedor: producto.id,
          precio: row.precio,
          moneda: row.moneda,
          fecha_actualizada: now,
        },
      });
      precios_creados += 1;
    }

    return {
      proveedor_id: proveedorId,
      filas_procesadas: rows.length,
      productos_creados,
      productos_actualizados,
      precios_creados,
      errores: [],
    };
  });
}

function productoChanged(
  actual: {
    nombre_producto_proveedor: string;
    marca_producto_proveedor: string | null;
    modelo_producto_proveedor: string | null;
    unidad: string | null;
    activo: boolean;
  },
  data: {
    nombre_producto_proveedor: string;
    marca_producto_proveedor: string | null;
    modelo_producto_proveedor: string | null;
    unidad: string | null;
    activo: boolean;
  },
) {
  return (
    actual.nombre_producto_proveedor !== data.nombre_producto_proveedor ||
    actual.marca_producto_proveedor !== data.marca_producto_proveedor ||
    actual.modelo_producto_proveedor !== data.modelo_producto_proveedor ||
    actual.unidad !== data.unidad ||
    actual.activo !== data.activo
  );
}
