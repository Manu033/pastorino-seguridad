import { z } from "zod";
import { optionalText, tipoFuenteSchema, tipoCotizacionSchema } from "./common.js";

export const proveedorCreateSchema = z.object({
  nombre: z.string().trim().min(1).max(150),
  email_contacto: optionalText(255),
  telefono: optionalText(80),
  tipo_fuente: tipoFuenteSchema,
  tipos: z.array(tipoCotizacionSchema).min(1),
  activo: z.boolean().default(true),
});

export const proveedorUpdateSchema = proveedorCreateSchema.partial();
