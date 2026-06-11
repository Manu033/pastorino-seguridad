import { useState } from "react";
import { request } from "../api/client.js";

export function useProductosBusqueda(apiUrl) {
  const [productosBusqueda, setProductosBusqueda] = useState([]);

  async function loadProductosBusqueda() {
    const query = new URLSearchParams({ page: "1", pageSize: "200" });
    const data = await request(apiUrl, `/productos-proveedor?${query}`);
    setProductosBusqueda(data.data || data);
  }

  return { productosBusqueda, loadProductosBusqueda };
}
