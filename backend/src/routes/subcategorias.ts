import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler, parseId } from "../http.js";
import { subcategoriaCreateSchema, subcategoriaUpdateSchema } from "../schemas/categoria.js";

export const subcategoriasRouter = Router();

subcategoriasRouter.get(
  "",
  asyncHandler(async (req, res) => {
    const id_categoria = req.query.id_categoria ? Number(req.query.id_categoria) : undefined;
    res.json(
      await prisma.subcategoria.findMany({
        where: id_categoria ? { id_categoria } : undefined,
        orderBy: { nombre: "asc" },
      }),
    );
  }),
);

subcategoriasRouter.post(
  "",
  asyncHandler(async (req, res) => {
    const data = subcategoriaCreateSchema.parse(req.body);
    const subcategoria = await prisma.subcategoria.create({ data });
    res.status(201).json(subcategoria);
  }),
);

subcategoriasRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = subcategoriaUpdateSchema.parse(req.body);
    res.json(await prisma.subcategoria.update({ where: { id }, data }));
  }),
);
