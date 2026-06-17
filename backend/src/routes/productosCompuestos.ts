import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { asyncHandler, HttpError, parseId } from "../http.js";

export const productosCompuestosRouter = Router();

const itemSchema = z.object({
  tipo: z.enum(["PRODUCTO", "MANUAL"]),
  id_producto_proveedor: z.number().int().positive().nullable().optional(),
  descripcion: z.string().min(1).max(500),
  cantidad: z.number().positive(),
  unidad: z.string().max(40).nullable().optional(),
  precio_unitario: z.number().nonnegative().nullable().optional(),
  moneda: z.enum(["ARS", "USD"]).nullable().optional(),
});

const createSchema = z.object({
  nombre: z.string().min(1).max(255),
  descripcion: z.string().nullable().optional(),
  items: z.array(itemSchema).min(1, "El compuesto debe tener al menos un item"),
});

const updateSchema = z.object({
  nombre: z.string().min(1).max(255),
  descripcion: z.string().nullable().optional(),
  activo: z.boolean().optional(),
  items: z.array(itemSchema).min(1, "El compuesto debe tener al menos un item"),
});

const includeItems = {
  items: {
    include: { producto_proveedor: true },
    orderBy: { id: "asc" as const },
  },
};

productosCompuestosRouter.get(
  "",
  asyncHandler(async (_req, res) => {
    const compuestos = await prisma.productoCompuesto.findMany({
      include: includeItems,
      orderBy: { nombre: "asc" },
    });
    res.json(compuestos);
  }),
);

productosCompuestosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const compuesto = await prisma.productoCompuesto.findUnique({
      where: { id },
      include: includeItems,
    });
    if (!compuesto) throw new HttpError(404, "Producto compuesto no encontrado");
    res.json(compuesto);
  }),
);

productosCompuestosRouter.post(
  "",
  asyncHandler(async (req, res) => {
    const { nombre, descripcion, items } = createSchema.parse(req.body);
    const compuesto = await prisma.productoCompuesto.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        items: { create: items.map(mapItem) },
      },
      include: includeItems,
    });
    res.status(201).json(compuesto);
  }),
);

productosCompuestosRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const existing = await prisma.productoCompuesto.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Producto compuesto no encontrado");

    const { nombre, descripcion, activo, items } = updateSchema.parse(req.body);

    const compuesto = await prisma.$transaction(async (tx) => {
      await tx.productoCompuestoItem.deleteMany({ where: { id_producto_compuesto: id } });
      return tx.productoCompuesto.update({
        where: { id },
        data: {
          nombre,
          descripcion: descripcion ?? null,
          activo: activo ?? existing.activo,
          items: { create: items.map(mapItem) },
        },
        include: includeItems,
      });
    });

    res.json(compuesto);
  }),
);

function mapItem(item: z.infer<typeof itemSchema>) {
  return {
    tipo: item.tipo,
    id_producto_proveedor: item.id_producto_proveedor ?? null,
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    unidad: item.unidad ?? null,
    precio_unitario: item.precio_unitario ?? null,
    moneda: item.moneda ?? null,
  };
}
