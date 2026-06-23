import http from "http";
import { Router } from "express";
import { asyncHandler } from "../http.js";

export const clientesRouter = Router();

const CLIENTES_API_URL = process.env.CLIENTES_API_URL || "http://25.100.200.6:5000/api/clientes";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type ClienteExterno = { CL_NOMBRE: string; CL_CUIT: string };
type ClienteNormalizado = { nombre: string; cuit: string };

let cache: ClienteNormalizado[] | null = null;
let cacheAt = 0;

function fetchClientes(): Promise<ClienteExterno[]> {
  return new Promise((resolve, reject) => {
    http.get(CLIENTES_API_URL, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function getClientes(): Promise<ClienteNormalizado[]> {
  if (cache && Date.now() - cacheAt < CACHE_TTL_MS) return cache;

  const data = await fetchClientes();
  cache = data.map((c) => ({
    nombre: c.CL_NOMBRE.trim(),
    cuit: c.CL_CUIT.trim(),
  }));
  cacheAt = Date.now();
  return cache;
}

clientesRouter.get(
  "",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim().toLowerCase();
    const clientes = await getClientes();

    if (!q) return res.json(clientes);

    const results = clientes.filter((c) => c.nombre.toLowerCase().includes(q) || c.cuit.includes(q));
    res.json(results);
  }),
);
