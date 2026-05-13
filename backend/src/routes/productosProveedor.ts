import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler, HttpError, parseId } from "../http.js";
import {
  productoProveedorCreateSchema,
  productoProveedorUpdateSchema,
  vincularProductoSchema,
} from "../schemas/productoProveedor.js";

export const productosProveedorRouter = Router();

productosProveedorRouter.get(
  "",
  asyncHandler(async (req, res) => {
    const id_proveedor = req.query.id_proveedor ? Number(req.query.id_proveedor) : undefined;
    const id_producto = req.query.id_producto ? Number(req.query.id_producto) : undefined;
    const buscar = typeof req.query.buscar === "string" ? req.query.buscar.trim() : "";
    const productos = await prisma.productoProveedor.findMany({
      where: {
        ...(id_proveedor ? { id_proveedor } : {}),
        ...(id_producto ? { id_producto } : {}),
        ...(buscar
          ? {
              OR: [
                { sku_producto_proveedor: { contains: buscar, mode: "insensitive" } },
                { nombre_producto_proveedor: { contains: buscar, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { proveedor: true, producto: true },
      orderBy: { nombre_producto_proveedor: "asc" },
    });
    res.json(productos);
  }),
);

productosProveedorRouter.get(
  "/pendientes",
  asyncHandler(async (req, res) => {
    const id_proveedor = req.query.id_proveedor ? Number(req.query.id_proveedor) : undefined;
    const productos = await prisma.productoProveedor.findMany({
      where: { id_producto: null, ...(id_proveedor ? { id_proveedor } : {}) },
      include: { proveedor: true },
      orderBy: { nombre_producto_proveedor: "asc" },
    });
    res.json(productos);
  }),
);

productosProveedorRouter.post(
  "",
  asyncHandler(async (req, res) => {
    const data = productoProveedorCreateSchema.parse(req.body);
    const producto = await prisma.productoProveedor.create({ data });
    res.status(201).json(producto);
  }),
);

productosProveedorRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = productoProveedorUpdateSchema.parse(req.body);
    res.json(await prisma.productoProveedor.update({ where: { id }, data }));
  }),
);

productosProveedorRouter.post(
  "/:id/vincular",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const { id_producto } = vincularProductoSchema.parse(req.body);
    const producto = await prisma.producto.findUnique({ where: { id: id_producto } });
    if (!producto) throw new HttpError(404, "Producto interno no encontrado");
    res.json(await prisma.productoProveedor.update({ where: { id }, data: { id_producto } }));
  }),
);

productosProveedorRouter.post(
  "/:id/desvincular",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    res.json(await prisma.productoProveedor.update({ where: { id }, data: { id_producto: null } }));
  }),
);
