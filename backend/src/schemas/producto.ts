import { z } from "zod";
import { optionalText } from "./common.js";

export const productoCreateSchema = z.object({
  sku_interno: z.string().trim().min(1).max(80),
  nombre_normalizado: z.string().trim().min(1).max(255),
  id_categoria: z.number().int().positive(),
  id_subcategoria: z.number().int().positive().nullable().optional(),
  marca: optionalText(120),
  modelo: optionalText(120),
  descripcion: z.string().trim().optional().nullable().transform((value) => value || null),
  imagen_url: optionalText(500),
  activo: z.boolean().default(true),
});

export const productoUpdateSchema = productoCreateSchema.partial();
