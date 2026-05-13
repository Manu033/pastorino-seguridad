import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler, HttpError, parseId } from "../http.js";
import { booleanQuerySchema } from "../schemas/common.js";
import { proveedorCreateSchema, proveedorUpdateSchema } from "../schemas/proveedor.js";

export const proveedoresRouter = Router();

proveedoresRouter.get(
  "",
  asyncHandler(async (req, res) => {
    const incluirInactivos = booleanQuerySchema.parse(req.query.incluir_inactivos);
    const proveedores = await prisma.proveedor.findMany({
      where: incluirInactivos ? undefined : { activo: true },
      orderBy: { nombre: "asc" },
    });
    res.json(proveedores);
  }),
);

proveedoresRouter.post(
  "",
  asyncHandler(async (req, res) => {
    const data = proveedorCreateSchema.parse(req.body);
    const proveedor = await prisma.proveedor.create({ data });
    res.status(201).json(proveedor);
  }),
);

proveedoresRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const proveedor = await prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) throw new HttpError(404, "Proveedor no encontrado");
    res.json(proveedor);
  }),
);

proveedoresRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = proveedorUpdateSchema.parse(req.body);
    const proveedor = await prisma.proveedor.update({ where: { id }, data });
    res.json(proveedor);
  }),
);

proveedoresRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const proveedor = await prisma.proveedor.update({ where: { id }, data: { activo: false } });
    res.json(proveedor);
  }),
);
