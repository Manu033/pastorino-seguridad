import { z } from "zod";

export const categoriaCreateSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
});

export const categoriaUpdateSchema = categoriaCreateSchema.partial();

export const subcategoriaCreateSchema = z.object({
  id_categoria: z.number().int().positive(),
  nombre: z.string().trim().min(1).max(120),
});

export const subcategoriaUpdateSchema = subcategoriaCreateSchema.partial();
