import { z } from "zod";
import { monedaSchema, optionalText } from "./common.js";

export const filaImportacionNormalizadaSchema = z.object({
  sku_producto_proveedor: z.string().trim().min(1).max(120),
  nombre_producto_proveedor: z.string().trim().min(1).max(255),
  marca_producto_proveedor: optionalText(120),
  modelo_producto_proveedor: optionalText(120),
  unidad: optionalText(40),
  unidad_calculo: optionalText(40),
  cantidad_por_unidad_compra: z.coerce.number().positive().optional().nullable(),
  redondeo_compra: z.enum(["ARRIBA"]).optional().nullable(),
  moneda: monedaSchema,
  precio: z.coerce.number().positive(),
});

export const importacionJsonSchema = z.array(filaImportacionNormalizadaSchema);

export type FilaImportacionNormalizada = z.infer<typeof filaImportacionNormalizadaSchema>;
