import { useState } from "react";
import { request } from "../api/client.js";

export function useBaseData(apiUrl, run) {
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  async function loadBaseData(filters = {}) {
    await run("Datos actualizados", async () => {
      const incluirInactivos = filters.incluirInactivos ?? false;
      const [proveedoresData, categoriasData, subcategoriasData] = await Promise.all([
        request(apiUrl, `/proveedores?incluir_inactivos=${incluirInactivos}`),
        request(apiUrl, "/categorias"),
        request(apiUrl, "/subcategorias"),
      ]);
      setProveedores(proveedoresData);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
    });
  }

  return { proveedores, categorias, setCategorias, subcategorias, loadBaseData };
}
