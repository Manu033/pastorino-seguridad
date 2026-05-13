import { z } from "zod";
import { monedaSchema, optionalText } from "./common.js";

export const productoProveedorCreateSchema = z.object({
  id_proveedor: z.number().int().positive(),
  id_producto: z.number().int().positive().nullable().optional(),
  sku_producto_proveedor: z.string().trim().min(1).max(120),
  nombre_producto_proveedor: z.string().trim().min(1).max(255),
  marca_producto_proveedor: optionalText(120),
  modelo_producto_proveedor: optionalText(120),
  unidad: optionalText(40),
  precio_actual: z.coerce.number().positive().optional().nullable(),
  moneda_actual: monedaSchema.optional().nullable(),
  fecha_precio_actualizada: z.coerce.date().optional().nullable(),
  activo: z.boolean().default(true),
});

export const productoProveedorUpdateSchema = productoProveedorCreateSchema.partial();

export const vincularProductoSchema = z.object({
  id_producto: z.number().int().positive(),
});
