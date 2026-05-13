import { z } from "zod";
import { optionalText, tipoFuenteSchema } from "./common.js";

export const proveedorCreateSchema = z.object({
  nombre: z.string().trim().min(1).max(150),
  email_contacto: optionalText(255),
  telefono: optionalText(80),
  tipo_fuente: tipoFuenteSchema,
  activo: z.boolean().default(true),
});

export const proveedorUpdateSchema = proveedorCreateSchema.partial();
