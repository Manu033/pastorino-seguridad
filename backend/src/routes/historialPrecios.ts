import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler, HttpError, parseId } from "../http.js";

export const historialPreciosRouter = Router();

historialPreciosRouter.get(
  "/productos-proveedor/:id/historial-precios",
  asyncHandler(async (req, res) => {
    const id_producto_proveedor = parseId(req.params.id, "id_producto_proveedor");
    const existe = await prisma.productoProveedor.findUnique({ where: { id: id_producto_proveedor } });
    if (!existe) throw new HttpError(404, "Producto de proveedor no encontrado");
    const historial = await prisma.historialPrecio.findMany({
      where: { id_producto_proveedor },
      orderBy: { fecha_actualizada: "desc" },
    });
    res.json(historial);
  }),
);

historialPreciosRouter.get(
  "/productos-proveedor/:id/ultimo-precio",
  asyncHandler(async (req, res) => {
    const id_producto_proveedor = parseId(req.params.id, "id_producto_proveedor");
    const producto = await prisma.productoProveedor.findUnique({ where: { id: id_producto_proveedor } });
    if (!producto) throw new HttpError(404, "Producto de proveedor no encontrado");
    const ultimoPrecio = await prisma.historialPrecio.findFirst({
      where: { id_producto_proveedor },
      orderBy: { fecha_actualizada: "desc" },
    });
    res.json(ultimoPrecio);
  }),
);
