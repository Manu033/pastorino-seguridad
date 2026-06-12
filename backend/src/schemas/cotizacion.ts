import { z } from "zod";
import { monedaSchema, optionalText } from "./common.js";

const cotizacionItemSchema = z.object({
  id_producto_proveedor: z.number().int().positive().nullable().optional(),
  tipo: z.enum(["PRODUCTO", "MANUAL"]),
  descripcion: z.string().trim().min(1).max(500),
  cantidad: z.coerce.number().positive(),
  unidad: optionalText(40),
  precio_unitario: z.coerce.number().nonnegative(),
  moneda: monedaSchema,
  total_usd: z.coerce.number().nonnegative(),
});

export const cotizacionCreateSchema = z.object({
  tipo: z.enum(["EXTINCION", "DETECCION", "SALA_BOMBAS"]).default("EXTINCION"),
  titulo: z.string().trim().min(1).max(180),
  cliente: optionalText(180),
  contacto_cliente: optionalText(180),
  cuit_cliente: optionalText(80),
  email_cliente: optionalText(255),
  obra: optionalText(180),
  fecha_emision: z.coerce.date().optional().nullable(),
  validez_dias: z.coerce.number().int().positive().optional().nullable(),
  moneda_base: monedaSchema.default("USD"),
  observaciones: optionalText(2000),
  dolar_referencia: z.coerce.number().positive().optional().nullable(),
  costo_directo_usd: z.coerce.number().nonnegative().default(0),
  porcentaje_utilidad: z.coerce.number().nonnegative().default(0),
  monto_utilidad_usd: z.coerce.number().nonnegative().default(0),
  subtotal_usd: z.coerce.number().nonnegative().default(0),
  aplica_costos_varios: z.coerce.boolean().default(false),
  porcentaje_costos_varios: z.coerce.number().nonnegative().default(0),
  monto_costos_varios_usd: z.coerce.number().nonnegative().default(0),
  total_usd: z.coerce.number().nonnegative(),
  items: z.array(cotizacionItemSchema).min(1),
});

export const cotizacionUpdateSchema = cotizacionCreateSchema;
