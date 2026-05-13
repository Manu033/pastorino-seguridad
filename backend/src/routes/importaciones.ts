import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler, HttpError, parseId } from "../http.js";
import { importacionJsonSchema } from "../schemas/importacion.js";
import { processImportacionJson } from "../services/importService.js";

export const importacionesRouter = Router();

importacionesRouter.post(
  "/:proveedorId/preview-json",
  asyncHandler(async (req, res) => {
    const proveedorId = parseId(req.params.proveedorId, "proveedorId");
    const proveedor = await prisma.proveedor.findUnique({ where: { id: proveedorId } });
    if (!proveedor) throw new HttpError(404, "Proveedor no encontrado");
    res.json(importacionJsonSchema.parse(req.body));
  }),
);

importacionesRouter.post(
  "/:proveedorId/procesar-json",
  asyncHandler(async (req, res) => {
    const proveedorId = parseId(req.params.proveedorId, "proveedorId");
    const rows = importacionJsonSchema.parse(req.body);
    try {
      const resultado = await processImportacionJson(prisma, proveedorId, rows);
      res.status(201).json(resultado);
    } catch (error) {
      if (error instanceof Error && error.message === "Proveedor no encontrado") {
        throw new HttpError(404, error.message);
      }
      throw error;
    }
  }),
);
