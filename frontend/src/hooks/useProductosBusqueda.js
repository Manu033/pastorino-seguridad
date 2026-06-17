import { useState } from "react";
import { request } from "../api/client.js";

export function useProductosBusqueda(apiUrl) {
  const [productosBusqueda, setProductosBusqueda] = useState([]);

  async function loadProductosBusqueda() {
    const [productosData, compuestosData] = await Promise.all([
      request(apiUrl, `/productos-proveedor`),
      request(apiUrl, `/productos-compuestos`),
    ]);
    const productos = (productosData.data || productosData).map((p) => ({ ...p, _tipo: "SIMPLE" }));
    const compuestos = (Array.isArray(compuestosData) ? compuestosData : [])
      .filter((c) => c.activo !== false)
      .map((c) => ({ ...c, _tipo: "COMPUESTO" }));
    setProductosBusqueda([...productos, ...compuestos]);
  }

  return { productosBusqueda, loadProductosBusqueda };
}
