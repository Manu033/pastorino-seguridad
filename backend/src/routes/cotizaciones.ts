import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler, HttpError, parseId } from "../http.js";
import { cotizacionCreateSchema, cotizacionStatusSchema, cotizacionUpdateSchema } from "../schemas/cotizacion.js";

export const cotizacionesRouter = Router();

function cotizacionItemCreateData(item: any) {
  return {
    id_producto_proveedor: item.id_producto_proveedor,
    tipo: item.tipo,
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    unidad: item.unidad,
    precio_unitario: item.precio_unitario,
    moneda: item.moneda,
    total_usd: item.total_usd,
    metros_requeridos: item.metros_requeridos,
    generado_automaticamente: item.generado_automaticamente,
    formula_automatica: item.formula_automatica,
  } as any;
}

cotizacionesRouter.get(
  "",
  asyncHandler(async (_req, res) => {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { creada_en: "desc" },
    });
    res.json(cotizaciones);
  }),
);

cotizacionesRouter.post(
  "",
  asyncHandler(async (req, res) => {
    const data = cotizacionCreateSchema.parse(req.body);
    const cotizacion = await prisma.cotizacion.create({
      data: {
        tipo: data.tipo,
        titulo: data.titulo,
        cliente: data.cliente,
        contacto_cliente: data.contacto_cliente,
        cuit_cliente: data.cuit_cliente,
        email_cliente: data.email_cliente,
        obra: data.obra,
        fecha_emision: data.fecha_emision,
        validez_dias: data.validez_dias,
        moneda_base: data.moneda_base,
        observaciones: data.observaciones,
        dolar_referencia: data.dolar_referencia,
        costo_directo_usd: data.costo_directo_usd,
        porcentaje_utilidad: data.porcentaje_utilidad,
        monto_utilidad_usd: data.monto_utilidad_usd,
        subtotal_usd: data.subtotal_usd,
        aplica_costos_varios: data.aplica_costos_varios,
        porcentaje_costos_varios: data.porcentaje_costos_varios,
        monto_costos_varios_usd: data.monto_costos_varios_usd,
        total_usd: data.total_usd,
        items: {
          create: data.items.map(cotizacionItemCreateData),
        },
      },
      include: {
        items: {
          include: { producto_proveedor: { include: { proveedor: true } } },
          orderBy: { id: "asc" },
        },
      },
    });
    res.status(201).json(cotizacion);
  }),
);

cotizacionesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id },
      include: {
        items: {
          include: { producto_proveedor: { include: { proveedor: true } } },
          orderBy: { id: "asc" },
        },
      },
    });
    if (!cotizacion) throw new HttpError(404, "Cotizacion no encontrada");
    res.json(cotizacion);
  }),
);

cotizacionesRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const result = cotizacionStatusSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid status value", details: result.error.flatten() });
      return;
    }
    const { estado } = result.data;
    const existe = await prisma.cotizacion.findUnique({ where: { id } });
    if (!existe) throw new HttpError(404, "Cotizacion no encontrada");
    const cotizacion = await prisma.cotizacion.update({
      where: { id },
      data: { estado },
      include: {
        items: {
          include: { producto_proveedor: { include: { proveedor: true } } },
          orderBy: { id: "asc" },
        },
      },
    });
    res.json(cotizacion);
  }),
);

cotizacionesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = cotizacionUpdateSchema.parse(req.body);
    const existe = await prisma.cotizacion.findUnique({ where: { id } });
    if (!existe) throw new HttpError(404, "Cotizacion no encontrada");

    const cotizacion = await prisma.$transaction(async (tx) => {
      await tx.cotizacionItem.deleteMany({ where: { id_cotizacion: id } });
      return tx.cotizacion.update({
        where: { id },
        data: {
          tipo: data.tipo,
          titulo: data.titulo,
          cliente: data.cliente,
          contacto_cliente: data.contacto_cliente,
          cuit_cliente: data.cuit_cliente,
          email_cliente: data.email_cliente,
          obra: data.obra,
          fecha_emision: data.fecha_emision,
          validez_dias: data.validez_dias,
          moneda_base: data.moneda_base,
          observaciones: data.observaciones,
          dolar_referencia: data.dolar_referencia,
          costo_directo_usd: data.costo_directo_usd,
          porcentaje_utilidad: data.porcentaje_utilidad,
          monto_utilidad_usd: data.monto_utilidad_usd,
          subtotal_usd: data.subtotal_usd,
          aplica_costos_varios: data.aplica_costos_varios,
          porcentaje_costos_varios: data.porcentaje_costos_varios,
          monto_costos_varios_usd: data.monto_costos_varios_usd,
          total_usd: data.total_usd,
          items: {
            create: data.items.map(cotizacionItemCreateData),
          },
        },
        include: {
          items: {
            include: { producto_proveedor: { include: { proveedor: true } } },
            orderBy: { id: "asc" },
          },
        },
      });
    });

    res.json(cotizacion);
  }),
);
