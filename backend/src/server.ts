import "dotenv/config";
import cors from "cors";
import express from "express";
import { prisma } from "./db/prisma.js";
import { errorHandler } from "./http.js";
import { categoriasRouter } from "./routes/categorias.js";
import { historialPreciosRouter } from "./routes/historialPrecios.js";
import { importacionesRouter } from "./routes/importaciones.js";
import { productosRouter } from "./routes/productos.js";
import { productosProveedorRouter } from "./routes/productosProveedor.js";
import { proveedoresRouter } from "./routes/proveedores.js";
import { subcategoriasRouter } from "./routes/subcategorias.js";

const app = express();
const port = Number(process.env.PORT || 8001);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/proveedores", proveedoresRouter);
app.use("/categorias", categoriasRouter);
app.use("/subcategorias", subcategoriasRouter);
app.use("/productos", productosRouter);
app.use("/productos-proveedor", productosProveedorRouter);
app.use("/importaciones", importacionesRouter);
app.use(historialPreciosRouter);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`API Node escuchando en http://127.0.0.1:${port}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
