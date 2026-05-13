import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler, parseId } from "../http.js";
import { categoriaCreateSchema, categoriaUpdateSchema } from "../schemas/categoria.js";

export const categoriasRouter = Router();

categoriasRouter.get(
  "",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.categoria.findMany({ orderBy: { nombre: "asc" } }));
  }),
);

categoriasRouter.post(
  "",
  asyncHandler(async (req, res) => {
    const data = categoriaCreateSchema.parse(req.body);
    const categoria = await prisma.categoria.create({ data });
    res.status(201).json(categoria);
  }),
);

categoriasRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = categoriaUpdateSchema.parse(req.body);
    res.json(await prisma.categoria.update({ where: { id }, data }));
  }),
);
