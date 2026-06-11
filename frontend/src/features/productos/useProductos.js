import { useMemo, useState } from "react";
import { request } from "../../api/client.js";
import { emptyProductoProveedor } from "../../constants/forms.js";
import { cleanText, toNumberOrNull } from "../../utils/format.js";

function productoProveedorPayload(form) {
  return {
    id_proveedor: Number(form.id_proveedor),
    id_categoria: toNumberOrNull(form.id_categoria),
    id_subcategoria: toNumberOrNull(form.id_subcategoria),
    sku_producto_proveedor: form.sku_producto_proveedor,
    nombre_producto_proveedor: form.nombre_producto_proveedor,
    marca_producto_proveedor: cleanText(form.marca_producto_proveedor),
    modelo_producto_proveedor: cleanText(form.modelo_producto_proveedor),
    descripcion: cleanText(form.descripcion),
    imagen_url: cleanText(form.imagen_url),
    unidad: cleanText(form.unidad),
    unidad_calculo: cleanText(form.unidad_calculo),
    cantidad_por_unidad_compra: toNumberOrNull(form.cantidad_por_unidad_compra),
    redondeo_compra: form.redondeo_compra || null,
    precio_actual: toNumberOrNull(form.precio_actual),
    moneda_actual: form.moneda_actual || null,
    fecha_precio_actualizada: form.fecha_precio_actualizada ? new Date(form.fecha_precio_actualizada).toISOString() : null,
    activo: Boolean(form.activo),
  };
}

export function useProductos({ apiUrl, run, setError, subcategorias, loadProductosBusqueda }) {
  const [productoProveedorForm, setProductoProveedorForm] = useState(emptyProductoProveedor);
  const [editingProductoProveedor, setEditingProductoProveedor] = useState(null);
  const [productoProveedorModalOpen, setProductoProveedorModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productoEdit, setProductoEdit] = useState(null);
  const [productoEditando, setProductoEditando] = useState(false);
  const [filters, setFilters] = useState({
    incluirInactivos: false,
    buscarProductoProveedor: "",
    idProveedorProducto: "",
    idCategoriaProducto: "",
    idSubcategoriaProducto: "",
  });
  const [productosPage, setProductosPage] = useState(1);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [productosProveedorMeta, setProductosProveedorMeta] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 1 });

  const subcategoriasProductoProveedor = useMemo(
    () => subcategorias.filter((item) => String(item.id_categoria) === String(productoProveedorForm.id_categoria)),
    [subcategorias, productoProveedorForm.id_categoria],
  );

  const subcategoriasProductoEdit = useMemo(
    () => subcategorias.filter((item) => String(item.id_categoria) === String(productoEdit?.id_categoria)),
    [subcategorias, productoEdit?.id_categoria],
  );

  async function loadProductosProveedor(pageOverride) {
    const page = pageOverride ?? productosPage;
    await run("Productos de proveedor actualizados", async () => {
      const query = new URLSearchParams({
        ...(filters.buscarProductoProveedor ? { buscar: filters.buscarProductoProveedor } : {}),
        ...(filters.idProveedorProducto ? { id_proveedor: filters.idProveedorProducto } : {}),
        ...(filters.idCategoriaProducto ? { id_categoria: filters.idCategoriaProducto } : {}),
        ...(filters.idSubcategoriaProducto ? { id_subcategoria: filters.idSubcategoriaProducto } : {}),
        page: String(page),
        pageSize: String(productosProveedorMeta.pageSize),
      });
      const data = await request(apiUrl, `/productos-proveedor?${query}`);
      setProductosProveedor(data.data || data);
      if (data.data) {
        setProductosProveedorMeta({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        });
        setProductosPage(data.page);
      }
    });
  }

  function searchProductosProveedor() {
    setProductosPage(1);
    loadProductosProveedor(1);
  }

  function goProductosPage(page) {
    const nextPage = Math.min(Math.max(page, 1), productosProveedorMeta.totalPages || 1);
    setProductosPage(nextPage);
    loadProductosProveedor(nextPage);
  }

  async function saveProductoProveedor(event) {
    event.preventDefault();
    await run("Producto de proveedor guardado", async () => {
      const id = editingProductoProveedor;
      await request(apiUrl, id ? `/productos-proveedor/${id}` : "/productos-proveedor", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(productoProveedorPayload(productoProveedorForm)),
      });
      setProductoProveedorForm(emptyProductoProveedor);
      setEditingProductoProveedor(null);
      setProductoProveedorModalOpen(false);
      await loadProductosProveedor();
      await loadProductosBusqueda();
    });
  }

  function openNuevoProductoModal() {
    setProductoProveedorForm(emptyProductoProveedor);
    setEditingProductoProveedor(null);
    setProductoProveedorModalOpen(true);
  }

  function closeNuevoProductoModal() {
    setProductoProveedorForm(emptyProductoProveedor);
    setEditingProductoProveedor(null);
    setProductoProveedorModalOpen(false);
  }

  function openProductoModal(producto) {
    const edit = {
      ...producto,
      id_categoria: producto.id_categoria || "",
      id_subcategoria: producto.id_subcategoria || "",
      fecha_precio_actualizada: producto.fecha_precio_actualizada ? producto.fecha_precio_actualizada.slice(0, 16) : "",
    };
    setProductoSeleccionado(producto);
    setProductoEdit(edit);
    setProductoEditando(false);
  }

  function closeProductoModal() {
    setProductoSeleccionado(null);
    setProductoEdit(null);
    setProductoEditando(false);
  }

  function cancelProductoEdit() {
    if (!productoSeleccionado) return;
    openProductoModal(productoSeleccionado);
  }

  async function saveProductoEdit() {
    if (!productoEdit?.id_proveedor) {
      setError("Selecciona un proveedor para el producto");
      return;
    }
    if (!productoEdit?.sku_producto_proveedor?.trim() || !productoEdit?.nombre_producto_proveedor?.trim()) {
      setError("Carga SKU y nombre del producto");
      return;
    }
    await run("Producto actualizado", async () => {
      const updated = await request(apiUrl, `/productos-proveedor/${productoEdit.id}`, {
        method: "PUT",
        body: JSON.stringify(productoProveedorPayload(productoEdit)),
      });
      const normalized = {
        ...updated,
        id_categoria: updated.id_categoria || "",
        id_subcategoria: updated.id_subcategoria || "",
        fecha_precio_actualizada: updated.fecha_precio_actualizada ? updated.fecha_precio_actualizada.slice(0, 16) : "",
      };
      setProductoSeleccionado(updated);
      setProductoEdit(normalized);
      setProductoEditando(false);
      await loadProductosProveedor();
      await loadProductosBusqueda();
    });
  }

  // Adapter: expose editing shape compatible with ProductosTab
  const editing = { productoProveedor: editingProductoProveedor };
  function setEditing(updater) {
    const next = typeof updater === "function" ? updater(editing) : updater;
    setEditingProductoProveedor(next.productoProveedor ?? null);
  }

  return {
    productoProveedorForm,
    setProductoProveedorForm,
    editing,
    setEditing,
    productoProveedorModalOpen,
    productoSeleccionado,
    productoEdit,
    setProductoEdit,
    productoEditando,
    setProductoEditando,
    filters,
    setFilters,
    productosPage,
    productosProveedor,
    productosProveedorMeta,
    subcategoriasProductoProveedor,
    subcategoriasProductoEdit,
    loadProductosProveedor,
    searchProductosProveedor,
    goProductosPage,
    saveProductoProveedor,
    openNuevoProductoModal,
    closeNuevoProductoModal,
    openProductoModal,
    closeProductoModal,
    cancelProductoEdit,
    saveProductoEdit,
  };
}
