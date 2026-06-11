import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler, HttpError, parseId } from "../http.js";
import {
  bulkCategorizarSchema,
  productoProveedorCreateSchema,
  productoProveedorUpdateSchema,
} from "../schemas/productoProveedor.js";

export const productosProveedorRouter = Router();

productosProveedorRouter.get(
  "",
  asyncHandler(async (req, res) => {
    const id_proveedor = req.query.id_proveedor ? Number(req.query.id_proveedor) : undefined;
    const id_categoria = req.query.id_categoria ? Number(req.query.id_categoria) : undefined;
    const id_subcategoria = req.query.id_subcategoria ? Number(req.query.id_subcategoria) : undefined;
    const sin_categoria = req.query.sin_categoria === "true";
    const buscar = typeof req.query.buscar === "string" ? req.query.buscar.trim() : "";
    const page = req.query.page ? Math.max(Number(req.query.page), 1) : undefined;
    const pageSize = req.query.pageSize ? Math.min(Math.max(Number(req.query.pageSize), 1), 200) : undefined;
    const where = {
      ...(id_proveedor ? { id_proveedor } : {}),
      ...(sin_categoria ? { id_categoria: null } : id_categoria ? { id_categoria } : {}),
      ...(id_subcategoria ? { id_subcategoria } : {}),
      ...(buscar
        ? {
            OR: [
              { sku_producto_proveedor: { contains: buscar, mode: "insensitive" as const } },
              { nombre_producto_proveedor: { contains: buscar, mode: "insensitive" as const } },
              { marca_producto_proveedor: { contains: buscar, mode: "insensitive" as const } },
              { modelo_producto_proveedor: { contains: buscar, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const query = {
      where,
      include: { proveedor: true, categoria: true, subcategoria: true },
      orderBy: { nombre_producto_proveedor: "asc" as const },
    };

    if (page && pageSize) {
      const [productos, total] = await Promise.all([
        prisma.productoProveedor.findMany({ ...query, skip: (page - 1) * pageSize, take: pageSize }),
        prisma.productoProveedor.count({ where }),
      ]);
      res.json({ data: productos, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) });
      return;
    }

    const productos = await prisma.productoProveedor.findMany(query);
    res.json(productos);
  }),
);

productosProveedorRouter.patch(
  "/bulk-categorizar",
  asyncHandler(async (req, res) => {
    const { ids, id_categoria, id_subcategoria } = bulkCategorizarSchema.parse(req.body);
    await validateCategoriaSubcategoria({ id_categoria, id_subcategoria });
    const result = await prisma.productoProveedor.updateMany({
      where: { id: { in: ids } },
      data: { id_categoria, id_subcategoria },
    });
    res.json({ updated: result.count });
  }),
);

productosProveedorRouter.post(
  "",
  asyncHandler(async (req, res) => {
    const data = productoProveedorCreateSchema.parse(req.body);
    await validateCategoriaSubcategoria(data);
    const producto = await prisma.productoProveedor.create({ data });
    res.status(201).json(producto);
  }),
);

productosProveedorRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = productoProveedorUpdateSchema.parse(req.body);
    const actual = await prisma.productoProveedor.findUnique({ where: { id } });
    if (!actual) throw new HttpError(404, "Producto de proveedor no encontrado");
    await validateCategoriaSubcategoria({
      id_categoria: data.id_categoria === undefined ? actual.id_categoria : data.id_categoria,
      id_subcategoria: data.id_subcategoria === undefined ? actual.id_subcategoria : data.id_subcategoria,
    });
    res.json(await prisma.productoProveedor.update({ where: { id }, data }));
  }),
);

async function validateCategoriaSubcategoria(data: { id_categoria?: number | null; id_subcategoria?: number | null }) {
  if (!data.id_subcategoria) return;
  if (!data.id_categoria) throw new HttpError(400, "La subcategoria requiere una categoria");

  const subcategoria = await prisma.subcategoria.findUnique({ where: { id: data.id_subcategoria } });
  if (!subcategoria) throw new HttpError(409, "Subcategoria invalida");
  if (subcategoria.id_categoria !== data.id_categoria) {
    throw new HttpError(400, "La subcategoria no pertenece a la categoria seleccionada");
  }
}
