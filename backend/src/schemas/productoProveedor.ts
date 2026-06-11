import { z } from "zod";
import { monedaSchema, optionalText } from "./common.js";

export const productoProveedorCreateSchema = z.object({
  id_proveedor: z.number().int().positive(),
  id_categoria: z.number().int().positive().nullable().optional(),
  id_subcategoria: z.number().int().positive().nullable().optional(),
  sku_producto_proveedor: z.string().trim().min(1).max(120),
  nombre_producto_proveedor: z.string().trim().min(1).max(255),
  marca_producto_proveedor: optionalText(120),
  modelo_producto_proveedor: optionalText(120),
  descripcion: optionalText(2000),
  imagen_url: optionalText(500),
  unidad: optionalText(40),
  unidad_calculo: optionalText(40),
  cantidad_por_unidad_compra: z.coerce.number().positive().optional().nullable(),
  redondeo_compra: z.enum(["ARRIBA"]).optional().nullable(),
  precio_actual: z.coerce.number().positive().optional().nullable(),
  moneda_actual: monedaSchema.optional().nullable(),
  fecha_precio_actualizada: z.coerce.date().optional().nullable(),
  activo: z.boolean().default(true),
});

export const productoProveedorUpdateSchema = productoProveedorCreateSchema.partial();

export const bulkCategorizarSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  id_categoria: z.number().int().positive().nullable(),
  id_subcategoria: z.number().int().positive().nullable(),
});
