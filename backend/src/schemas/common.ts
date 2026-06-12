import { z } from "zod";

export const booleanQuerySchema = z
  .union([z.literal("true"), z.literal("false"), z.boolean()])
  .optional()
  .transform((value) => value === true || value === "true");

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);

export const monedaSchema = z.enum(["ARS", "USD"]);
export const tipoFuenteSchema = z.enum(["EXCEL", "PDF", "API", "MANUAL"]);
export const tipoCotizacionSchema = z.enum(["EXTINCION", "DETECCION", "SALA_BOMBAS"]);
