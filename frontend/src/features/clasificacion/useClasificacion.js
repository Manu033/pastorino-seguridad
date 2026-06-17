import { useMemo, useState } from "react";
import { request } from "../../api/client.js";

export function useClasificacion({ apiUrl, run, setError, subcategorias }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ idProveedor: "", soloSinCategoria: false });
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [categoriaAsignar, setCategoriaAsignar] = useState("");
  const [subcategoriaAsignar, setSubcategoriaAsignar] = useState("");
  const [productoEditar, setProductoEditar] = useState(null);
  const [categoriaEditar, setCategoriaEditar] = useState("");
  const [subcategoriaEditar, setSubcategoriaEditar] = useState("");

  const subcategoriasDisponibles = useMemo(
    () => subcategorias.filter((s) => String(s.id_categoria) === String(categoriaAsignar)),
    [subcategorias, categoriaAsignar],
  );

  const subcategoriasEditar = useMemo(
    () => subcategorias.filter((s) => String(s.id_categoria) === String(categoriaEditar)),
    [subcategorias, categoriaEditar],
  );

  async function cargarProductos() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ pageSize: "500" });
      if (filters.idProveedor) query.set("id_proveedor", filters.idProveedor);
      if (filters.soloSinCategoria) query.set("sin_categoria", "true");
      const data = await request(apiUrl, `/productos-proveedor?${query}`);
      setProductos(data.data || data);
      setSeleccionados(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleSeleccion(id) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleTodos() {
    if (seleccionados.size === productos.length && productos.length > 0) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(productos.map((p) => p.id)));
    }
  }

  async function aplicarCategoria() {
    if (seleccionados.size === 0) return;
    await run("Categoría aplicada", async () => {
      await request(apiUrl, "/productos-proveedor/bulk-categorizar", {
        method: "PATCH",
        body: JSON.stringify({
          ids: Array.from(seleccionados),
          id_categoria: categoriaAsignar ? Number(categoriaAsignar) : null,
          id_subcategoria: subcategoriaAsignar ? Number(subcategoriaAsignar) : null,
        }),
      });
      await cargarProductos();
    });
  }

  async function limpiarCategoria() {
    if (seleccionados.size === 0) return;
    await run("Categoría eliminada", async () => {
      await request(apiUrl, "/productos-proveedor/bulk-categorizar", {
        method: "PATCH",
        body: JSON.stringify({
          ids: Array.from(seleccionados),
          id_categoria: null,
          id_subcategoria: null,
        }),
      });
      await cargarProductos();
    });
  }

  function handleSetCategoriaAsignar(value) {
    setCategoriaAsignar(value);
    setSubcategoriaAsignar("");
  }

  function abrirModalEditar(producto) {
    setProductoEditar(producto);
    setCategoriaEditar(producto.id_categoria ? String(producto.id_categoria) : "");
    setSubcategoriaEditar(producto.id_subcategoria ? String(producto.id_subcategoria) : "");
  }

  function cerrarModalEditar() {
    setProductoEditar(null);
    setCategoriaEditar("");
    setSubcategoriaEditar("");
  }

  function handleSetCategoriaEditar(value) {
    setCategoriaEditar(value);
    setSubcategoriaEditar("");
  }

  async function guardarEdicion() {
    if (!productoEditar) return;
    await run("Categoría actualizada", async () => {
      await request(apiUrl, "/productos-proveedor/bulk-categorizar", {
        method: "PATCH",
        body: JSON.stringify({
          ids: [productoEditar.id],
          id_categoria: categoriaEditar ? Number(categoriaEditar) : null,
          id_subcategoria: subcategoriaEditar ? Number(subcategoriaEditar) : null,
        }),
      });
      cerrarModalEditar();
      await cargarProductos();
    });
  }

  return {
    productos,
    loading,
    filters,
    setFilters,
    seleccionados,
    categoriaAsignar,
    setCategoriaAsignar: handleSetCategoriaAsignar,
    subcategoriaAsignar,
    setSubcategoriaAsignar,
    subcategoriasDisponibles,
    cargarProductos,
    toggleSeleccion,
    toggleTodos,
    aplicarCategoria,
    limpiarCategoria,
    productoEditar,
    abrirModalEditar,
    cerrarModalEditar,
    categoriaEditar,
    setCategoriaEditar: handleSetCategoriaEditar,
    subcategoriaEditar,
    setSubcategoriaEditar,
    subcategoriasEditar,
    guardarEdicion,
  };
}
