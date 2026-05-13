import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function parseId(value: string | undefined, name = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${name} invalido`);
  }
  return id;
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ detail: error.message });
  }
  if (error instanceof ZodError) {
    return res.status(422).json({ detail: error.flatten() });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ detail: "Registro duplicado" });
    }
    if (error.code === "P2003") {
      return res.status(409).json({ detail: "Referencia invalida" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ detail: "Registro no encontrado" });
    }
  }
  console.error(error);
  return res.status(500).json({ detail: "Error interno" });
}
