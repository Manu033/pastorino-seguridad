import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler, HttpError, parseId } from "../http.js";
import {
  productoAccesorioAutomaticoSchema,
  productoAccesorioAutomaticoUpdateSchema,
} from "../schemas/productoProveedor.js";

export const productosAccesoriosAutomaticosRouter = Router();

const accesoriosModel = prisma.productoAccesorioAutomatico;

function normalizeUnit(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

productosAccesoriosAutomaticosRouter.get(
  "",
  asyncHandler(async (_req, res) => {
    const configs = await accesoriosModel.findMany({
      include: { producto_tubo: { include: { proveedor: true } }, producto_accesorio: { include: { proveedor: true } } },
      orderBy: { id: "asc" },
    });
    res.json(configs);
  }),
);

productosAccesoriosAutomaticosRouter.post(
  "",
  asyncHandler(async (req, res) => {
    const data = productoAccesorioAutomaticoSchema.parse(req.body);
    await validateAutomaticAccessory(data);
    const config = await accesoriosModel.create({ data });
    res.status(201).json(config);
  }),
);

productosAccesoriosAutomaticosRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const current = await accesoriosModel.findUnique({ where: { id } });
    if (!current) throw new HttpError(404, "Configuracion no encontrada");

    const data = productoAccesorioAutomaticoUpdateSchema.parse(req.body);
    const next = {
      id_producto_tubo: data.id_producto_tubo ?? current.id_producto_tubo,
      id_producto_accesorio: data.id_producto_accesorio ?? current.id_producto_accesorio,
      formula: data.formula ?? current.formula,
      separacion_maxima_m: data.separacion_maxima_m ?? (current.separacion_maxima_m == null ? null : Number(current.separacion_maxima_m)),
    };
    await validateAutomaticAccessory(next);
    res.json(await accesoriosModel.update({ where: { id }, data }));
  }),
);

async function validateAutomaticAccessory(data: {
  id_producto_tubo: number;
  id_producto_accesorio: number;
  formula: "PERA" | "SOPORTE" | "ACOPLE";
  separacion_maxima_m?: number | null;
}) {
  if (data.formula === "PERA" && (!data.separacion_maxima_m || data.separacion_maxima_m <= 0)) {
    throw new HttpError(400, "La formula PERA requiere separacion_maxima_m");
  }
  if (data.id_producto_tubo === data.id_producto_accesorio) {
    throw new HttpError(400, "El accesorio debe ser distinto del tubo");
  }

  const [tubo, accesorio] = await Promise.all([
    prisma.productoProveedor.findUnique({ where: { id: data.id_producto_tubo } }),
    prisma.productoProveedor.findUnique({ where: { id: data.id_producto_accesorio } }),
  ]);
  if (!tubo) throw new HttpError(404, "Producto tubo no encontrado");
  if (!accesorio) throw new HttpError(404, "Producto accesorio no encontrado");
  if (normalizeUnit(tubo.unidad) !== "tubo") {
    throw new HttpError(400, "El producto tubo debe tener unidad tubo");
  }
}
