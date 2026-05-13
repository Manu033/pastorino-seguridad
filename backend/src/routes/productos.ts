import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler, HttpError, parseId } from "../http.js";
import { booleanQuerySchema } from "../schemas/common.js";
import { productoCreateSchema, productoUpdateSchema } from "../schemas/producto.js";

export const productosRouter = Router();

productosRouter.get(
  "",
  asyncHandler(async (req, res) => {
    const incluirInactivos = booleanQuerySchema.parse(req.query.incluir_inactivos);
    const buscar = typeof req.query.buscar === "string" ? req.query.buscar.trim() : "";
    const productos = await prisma.producto.findMany({
      where: {
        ...(incluirInactivos ? {} : { activo: true }),
        ...(buscar
          ? {
              OR: [
                { sku_interno: { contains: buscar, mode: "insensitive" } },
                { nombre_normalizado: { contains: buscar, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { nombre_normalizado: "asc" },
    });
    res.json(productos);
  }),
);

productosRouter.post(
  "",
  asyncHandler(async (req, res) => {
    const data = productoCreateSchema.parse(req.body);
    const producto = await prisma.producto.create({ data });
    res.status(201).json(producto);
  }),
);

productosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) throw new HttpError(404, "Producto no encontrado");
    res.json(producto);
  }),
);

productosRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = productoUpdateSchema.parse(req.body);
    res.json(await prisma.producto.update({ where: { id }, data }));
  }),
);

productosRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    res.json(await prisma.producto.update({ where: { id }, data: { activo: false } }));
  }),
);
