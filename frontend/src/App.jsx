import React, { useEffect, useMemo, useState } from "react";
import { request } from "./api/client.js";
import { AppHeader, Tabs } from "./components/AppHeader.jsx";
import { Status } from "./components/ui.jsx";
import { CategoriasTab } from "./features/categorias/CategoriasTab.jsx";
import { CotizacionModal } from "./features/cotizaciones/CotizacionModal.jsx";
import { CotizacionesTab } from "./features/cotizaciones/CotizacionesTab.jsx";
import { calcularResumenCotizacion } from "./features/cotizaciones/calculos.js";
import { openCotizacionPdf } from "./features/cotizaciones/cotizacionPdf.js";
import { calcularCompraProducto, describirCompraProducto } from "./features/cotizaciones/unidades.js";
import { ImportacionesTab } from "./features/importaciones/ImportacionesTab.jsx";
import { HistorialPreciosTab } from "./features/precios/HistorialPreciosTab.jsx";
import { ProductoModal } from "./features/productos/ProductoModal.jsx";
import { ProductosTab } from "./features/productos/ProductosTab.jsx";
import { ProveedorModal } from "./features/proveedores/ProveedorModal.jsx";
import { ProveedoresTab } from "./features/proveedores/ProveedoresTab.jsx";
import {
  API_DEFAULT,
  DOLAR_OFICIAL_URL,
  emptyCategoria,
  emptyCotizacionForm,
  emptyCotizacionManual,
  emptyCotizacionManoObra,
  emptyCotizacionProducto,
  emptyProductoProveedor,
  emptyProveedor,
  emptySubcategoria,
  sampleImport,
} from "./constants/forms.js";
import { cleanText, toNumber, toNumberOrNull } from "./utils/format.js";

function normalizeSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, " ")
    .trim();
}

function App() {
  const [apiUrl, setApiUrl] = useState(API_DEFAULT);
  const [activeTab, setActiveTab] = useState("proveedores");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState("sin comprobar");
  const [dolarOficial, setDolarOficial] = useState(null);
  const [dolarError, setDolarError] = useState("");

  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [productosBusqueda, setProductosBusqueda] = useState([]);
  const [productosProveedorMeta, setProductosProveedorMeta] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  const [cotizaciones, setCotizaciones] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [ultimoPrecio, setUltimoPrecio] = useState(null);

  const [proveedorForm, setProveedorForm] = useState(emptyProveedor);
  const [categoriaForm, setCategoriaForm] = useState(emptyCategoria);
  const [subcategoriaForm, setSubcategoriaForm] = useState(emptySubcategoria);
  const [productoProveedorForm, setProductoProveedorForm] = useState(emptyProductoProveedor);
  const [editing, setEditing] = useState({});

  const [filters, setFilters] = useState({
    incluirInactivos: false,
    buscarProductoProveedor: "",
    idProveedorProducto: "",
    idCategoriaProducto: "",
    idSubcategoriaProducto: "",
  });
  const [productosPage, setProductosPage] = useState(1);
  const [historialId, setHistorialId] = useState("");
  const [historialFilters, setHistorialFilters] = useState({ buscar: "", idProveedor: "" });
  const [historialDropdownOpen, setHistorialDropdownOpen] = useState(false);
  const [cotizacionForm, setCotizacionForm] = useState(emptyCotizacionForm);
  const [cotizacionProducto, setCotizacionProducto] = useState(emptyCotizacionProducto);
  const [cotizacionManual, setCotizacionManual] = useState(emptyCotizacionManual);
  const [cotizacionManoObra, setCotizacionManoObra] = useState(emptyCotizacionManoObra);
  const [cotizacionItems, setCotizacionItems] = useState([]);
  const [cotizacionDropdownOpen, setCotizacionDropdownOpen] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [cotizacionEdit, setCotizacionEdit] = useState(null);
  const [cotizacionEditando, setCotizacionEditando] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [proveedorEdit, setProveedorEdit] = useState(null);
  const [proveedorEditando, setProveedorEditando] = useState(false);
  const [proveedorModalOpen, setProveedorModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productoEdit, setProductoEdit] = useState(null);
  const [productoEditando, setProductoEditando] = useState(false);
  const [productoProveedorModalOpen, setProductoProveedorModalOpen] = useState(false);
  const [importProveedorId, setImportProveedorId] = useState("");
  const [importJson, setImportJson] = useState(sampleImport);
  const [importResult, setImportResult] = useState(null);

  const subcategoriasProductoProveedor = useMemo(
    () => subcategorias.filter((item) => String(item.id_categoria) === String(productoProveedorForm.id_categoria)),
    [subcategorias, productoProveedorForm.id_categoria],
  );
  const subcategoriasProductoEdit = useMemo(
    () => subcategorias.filter((item) => String(item.id_categoria) === String(productoEdit?.id_categoria)),
    [subcategorias, productoEdit?.id_categoria],
  );
  const productosHistorial = useMemo(() => {
    const buscar = normalizeSearch(historialFilters.buscar);
    return productosBusqueda.filter((item) => {
      const coincideProveedor = !historialFilters.idProveedor || String(item.id_proveedor) === String(historialFilters.idProveedor);
      const texto = normalizeSearch(`${item.sku_producto_proveedor} ${item.nombre_producto_proveedor} ${item.proveedor?.nombre || ""}`);
      const coincideBusqueda = !buscar || texto.includes(buscar);
      return coincideProveedor && coincideBusqueda;
    });
  }, [historialFilters, productosBusqueda]);
  const productoHistorialSeleccionado = useMemo(
    () => productosBusqueda.find((item) => String(item.id) === String(historialId)),
    [historialId, productosBusqueda],
  );
  const productosCotizacion = useMemo(() => {
    const buscar = normalizeSearch(cotizacionProducto.buscar);
    return productosBusqueda.filter((item) => {
      const coincideProveedor = !cotizacionProducto.idProveedor || String(item.id_proveedor) === String(cotizacionProducto.idProveedor);
      const texto = normalizeSearch(`${item.sku_producto_proveedor} ${item.nombre_producto_proveedor} ${item.proveedor?.nombre || ""}`);
      return coincideProveedor && (!buscar || texto.includes(buscar));
    });
  }, [cotizacionProducto, productosBusqueda]);
  const productoCotizacionSeleccionado = useMemo(
    () => productosBusqueda.find((item) => String(item.id) === String(cotizacionProducto.idProducto)),
    [cotizacionProducto.idProducto, productosBusqueda],
  );
  const dolarVenta = toNumber(dolarOficial?.venta);
  const cotizacionCostoDirectoUsd = useMemo(
    () => cotizacionItems.reduce((total, item) => total + toNumber(item.total_usd), 0),
    [cotizacionItems],
  );
  const cotizacionResumen = useMemo(
    () => calcularResumenCotizacion(
      cotizacionCostoDirectoUsd,
      cotizacionForm.porcentaje_utilidad,
      cotizacionForm.aplica_costos_varios,
      cotizacionForm.porcentaje_costos_varios,
    ),
    [cotizacionCostoDirectoUsd, cotizacionForm],
  );
  const cotizacionEditCostoDirectoUsd = useMemo(
    () => (cotizacionEdit?.items || []).reduce((total, item) => total + toNumber(item.total_usd), 0),
    [cotizacionEdit],
  );
  const cotizacionEditResumen = useMemo(
    () => calcularResumenCotizacion(
      cotizacionEditCostoDirectoUsd,
      cotizacionEdit?.porcentaje_utilidad,
      cotizacionEdit?.aplica_costos_varios,
      cotizacionEdit?.porcentaje_costos_varios,
    ),
    [cotizacionEditCostoDirectoUsd, cotizacionEdit],
  );

  async function run(label, callback) {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await callback();
      setStatus(label);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function loadBaseData() {
    await run("Datos actualizados", async () => {
      const [proveedoresData, categoriasData, subcategoriasData] = await Promise.all([
        request(apiUrl, `/proveedores?incluir_inactivos=${filters.incluirInactivos}`),
        request(apiUrl, "/categorias"),
        request(apiUrl, "/subcategorias"),
      ]);
      setProveedores(proveedoresData);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
    });
  }

  async function loadProductosProveedor(pageOverride = productosPage) {
    await run("Productos de proveedor actualizados", async () => {
      const query = new URLSearchParams({
        ...(filters.buscarProductoProveedor ? { buscar: filters.buscarProductoProveedor } : {}),
        ...(filters.idProveedorProducto ? { id_proveedor: filters.idProveedorProducto } : {}),
        ...(filters.idCategoriaProducto ? { id_categoria: filters.idCategoriaProducto } : {}),
        ...(filters.idSubcategoriaProducto ? { id_subcategoria: filters.idSubcategoriaProducto } : {}),
        page: String(pageOverride),
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

  async function loadProductosBusqueda() {
    const query = new URLSearchParams({ page: "1", pageSize: "200" });
    const data = await request(apiUrl, `/productos-proveedor?${query}`);
    setProductosBusqueda(data.data || data);
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

  async function loadCotizaciones() {
    await run("Cotizaciones actualizadas", async () => {
      setCotizaciones(await request(apiUrl, "/cotizaciones"));
    });
  }

  async function checkHealth() {
    await run("API disponible", async () => {
      const data = await request(apiUrl, "/health");
      setHealth(data.status);
    });
  }

  async function loadDolarOficial() {
    try {
      setDolarError("");
      const response = await fetch(DOLAR_OFICIAL_URL);
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      const data = await response.json();
      setDolarOficial(data);
    } catch (err) {
      setDolarOficial(null);
      setDolarError(err instanceof Error ? err.message : "No se pudo consultar el dolar");
    }
  }

  useEffect(() => {
    loadBaseData();
    loadProductosProveedor();
    loadProductosBusqueda();
    loadCotizaciones();
    checkHealth();
    loadDolarOficial();
  }, []);

  function proveedorPayload(form) {
    return {
      nombre: form.nombre,
      email_contacto: cleanText(form.email_contacto),
      telefono: cleanText(form.telefono),
      tipo_fuente: form.tipo_fuente,
      activo: Boolean(form.activo),
    };
  }

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

  async function saveProveedor(event) {
    event.preventDefault();
    await run("Proveedor guardado", async () => {
      const id = editing.proveedor;
      await request(apiUrl, id ? `/proveedores/${id}` : "/proveedores", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(proveedorPayload(proveedorForm)),
      });
      setProveedorForm(emptyProveedor);
      setEditing((value) => ({ ...value, proveedor: null }));
      setProveedorModalOpen(false);
      await loadBaseData();
    });
  }

  function openNuevoProveedorModal() {
    setProveedorForm(emptyProveedor);
    setEditing((value) => ({ ...value, proveedor: null }));
    setProveedorModalOpen(true);
  }

  function closeNuevoProveedorModal() {
    setProveedorForm(emptyProveedor);
    setEditing((value) => ({ ...value, proveedor: null }));
    setProveedorModalOpen(false);
  }

  function openProveedorModal(proveedor) {
    setProveedorSeleccionado(proveedor);
    setProveedorEdit({ ...proveedor });
    setProveedorEditando(false);
  }

  function closeProveedorModal() {
    setProveedorSeleccionado(null);
    setProveedorEdit(null);
    setProveedorEditando(false);
  }

  function cancelProveedorEdit() {
    setProveedorEdit({ ...proveedorSeleccionado });
    setProveedorEditando(false);
  }

  async function saveProveedorEdit() {
    if (!proveedorEdit?.nombre?.trim()) {
      setError("Carga un nombre para el proveedor");
      return;
    }
    await run("Proveedor actualizado", async () => {
      const updated = await request(apiUrl, `/proveedores/${proveedorEdit.id}`, {
        method: "PUT",
        body: JSON.stringify(proveedorPayload(proveedorEdit)),
      });
      setProveedorSeleccionado(updated);
      setProveedorEdit({ ...updated });
      setProveedorEditando(false);
      await loadBaseData();
    });
  }

  async function saveCategoria(event) {
    event.preventDefault();
    await run("Categoria guardada", async () => {
      const id = editing.categoria;
      await request(apiUrl, id ? `/categorias/${id}` : "/categorias", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ nombre: categoriaForm.nombre }),
      });
      setCategoriaForm(emptyCategoria);
      setEditing((value) => ({ ...value, categoria: null }));
      await loadBaseData();
    });
  }

  async function saveSubcategoria(event) {
    event.preventDefault();
    await run("Subcategoria guardada", async () => {
      const id = editing.subcategoria;
      await request(apiUrl, id ? `/subcategorias/${id}` : "/subcategorias", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ id_categoria: Number(subcategoriaForm.id_categoria), nombre: subcategoriaForm.nombre }),
      });
      setSubcategoriaForm(emptySubcategoria);
      setEditing((value) => ({ ...value, subcategoria: null }));
      await loadBaseData();
    });
  }

  async function saveProductoProveedor(event) {
    event.preventDefault();
    await run("Producto de proveedor guardado", async () => {
      const id = editing.productoProveedor;
      await request(apiUrl, id ? `/productos-proveedor/${id}` : "/productos-proveedor", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(productoProveedorPayload(productoProveedorForm)),
      });
      setProductoProveedorForm(emptyProductoProveedor);
      setEditing((value) => ({ ...value, productoProveedor: null }));
      setProductoProveedorModalOpen(false);
      await loadProductosProveedor();
      await loadProductosBusqueda();
    });
  }

  function openNuevoProductoModal() {
    setProductoProveedorForm(emptyProductoProveedor);
    setEditing((value) => ({ ...value, productoProveedor: null }));
    setProductoProveedorModalOpen(true);
  }

  function closeNuevoProductoModal() {
    setProductoProveedorForm(emptyProductoProveedor);
    setEditing((value) => ({ ...value, productoProveedor: null }));
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

  function priceToUsd(precio, moneda) {
    const value = toNumber(precio);
    if (moneda === "USD") return value;
    if (!dolarVenta) return 0;
    return value / dolarVenta;
  }

  function itemTotalUsd(cantidad, precioUnitario, moneda, dolarReferencia = dolarVenta) {
    const cantidadNumber = toNumber(cantidad);
    const precioNumber = toNumber(precioUnitario);
    if (moneda === "USD") return cantidadNumber * precioNumber;
    const dolarNumber = toNumber(dolarReferencia);
    return dolarNumber ? (cantidadNumber * precioNumber) / dolarNumber : 0;
  }

  function addProductoCotizacion(event) {
    event.preventDefault();
    if (!productoCotizacionSeleccionado) {
      setError("Selecciona un producto para agregar");
      return;
    }
    if (!productoCotizacionSeleccionado.precio_actual || !productoCotizacionSeleccionado.moneda_actual) {
      setError("El producto seleccionado no tiene precio actual");
      return;
    }
    if (productoCotizacionSeleccionado.moneda_actual === "ARS" && !dolarVenta) {
      setError("No hay cotizacion de dolar disponible para convertir pesos a USD");
      return;
    }
    const cantidadRequerida = toNumber(cotizacionProducto.cantidad);
    if (cantidadRequerida <= 0) {
      setError("La cantidad debe ser mayor a cero");
      return;
    }
    const compra = calcularCompraProducto(productoCotizacionSeleccionado, cantidadRequerida);
    if (compra.cantidadCompra <= 0) {
      setError("No se pudo calcular la cantidad de compra del producto");
      return;
    }
    const unitUsd = priceToUsd(productoCotizacionSeleccionado.precio_actual, productoCotizacionSeleccionado.moneda_actual);
    const detalleCompra = describirCompraProducto(productoCotizacionSeleccionado, cantidadRequerida);
    setCotizacionItems((items) => [
      ...items,
      {
        localId: crypto.randomUUID(),
        id_producto_proveedor: productoCotizacionSeleccionado.id,
        tipo: "PRODUCTO",
        descripcion: [
          `${productoCotizacionSeleccionado.sku_producto_proveedor} - ${productoCotizacionSeleccionado.nombre_producto_proveedor}`,
          detalleCompra,
        ].filter(Boolean).join(" | "),
        cantidad: compra.cantidadCompra,
        unidad: productoCotizacionSeleccionado.unidad || "",
        precio_unitario: toNumber(productoCotizacionSeleccionado.precio_actual),
        moneda: productoCotizacionSeleccionado.moneda_actual,
        total_usd: compra.cantidadCompra * unitUsd,
      },
    ]);
    setCotizacionProducto(emptyCotizacionProducto);
    setCotizacionDropdownOpen(false);
    setError("");
  }

  function addManualCotizacion(event) {
    event.preventDefault();
    const cantidad = toNumber(cotizacionManual.cantidad);
    const precio = toNumber(cotizacionManual.precio_unitario);
    if (!cotizacionManual.descripcion.trim()) {
      setError("Carga una descripcion para el item manual");
      return;
    }
    if (cantidad <= 0 || precio < 0) {
      setError("Cantidad y precio manual invalidos");
      return;
    }
    if (cotizacionManual.moneda === "ARS" && !dolarVenta) {
      setError("No hay cotizacion de dolar disponible para convertir pesos a USD");
      return;
    }
    setCotizacionItems((items) => [
      ...items,
      {
        localId: crypto.randomUUID(),
        id_producto_proveedor: null,
        tipo: "MANUAL",
        descripcion: cotizacionManual.descripcion,
        cantidad,
        unidad: cleanText(cotizacionManual.unidad) || "",
        precio_unitario: precio,
        moneda: cotizacionManual.moneda,
        total_usd: cantidad * priceToUsd(precio, cotizacionManual.moneda),
      },
    ]);
    setCotizacionManual(emptyCotizacionManual);
    setError("");
  }

  function addManoObraCotizacion(event) {
    event.preventDefault();
    const personas = toNumber(cotizacionManoObra.personas);
    const dias = toNumber(cotizacionManoObra.dias);
    const precio = toNumber(cotizacionManoObra.precio_unitario);
    if (personas <= 0 || dias <= 0 || precio < 0) {
      setError("Personas, dias y precio de mano de obra invalidos");
      return;
    }
    if (cotizacionManoObra.moneda === "ARS" && !dolarVenta) {
      setError("No hay cotizacion de dolar disponible para convertir pesos a USD");
      return;
    }
    const cantidad = personas * dias;
    setCotizacionItems((items) => [
      ...items,
      {
        localId: crypto.randomUUID(),
        id_producto_proveedor: null,
        tipo: "MANUAL",
        descripcion: `Mano de obra - ${personas} persona${personas === 1 ? "" : "s"} x ${dias} dia${dias === 1 ? "" : "s"}`,
        cantidad,
        unidad: "jornal",
        precio_unitario: precio,
        moneda: cotizacionManoObra.moneda,
        total_usd: cantidad * priceToUsd(precio, cotizacionManoObra.moneda),
      },
    ]);
    setCotizacionManoObra(emptyCotizacionManoObra);
    setError("");
  }

  async function saveCotizacion(event) {
    event.preventDefault();
    if (!cotizacionForm.titulo.trim()) {
      setError("Carga un titulo para la cotizacion");
      return;
    }
    if (!cotizacionItems.length) {
      setError("Agrega al menos un item a la cotizacion");
      return;
    }
    await run("Cotizacion guardada", async () => {
      await request(apiUrl, "/cotizaciones", {
        method: "POST",
        body: JSON.stringify({
          ...cotizacionForm,
          cliente: cleanText(cotizacionForm.cliente),
          obra: cleanText(cotizacionForm.obra),
          observaciones: cleanText(cotizacionForm.observaciones),
          dolar_referencia: dolarVenta || null,
          ...cotizacionResumen,
          items: cotizacionItems.map(({ localId: _localId, ...item }) => item),
        }),
      });
      setCotizacionForm(emptyCotizacionForm);
      setCotizacionItems([]);
      await loadCotizaciones();
    });
  }

  async function openCotizacion(id) {
    await run("Cotizacion cargada", async () => {
      const cotizacion = await request(apiUrl, `/cotizaciones/${id}`);
      setCotizacionSeleccionada(cotizacion);
      setCotizacionEdit({
        ...cotizacion,
        titulo: cotizacion.titulo || "",
        cliente: cotizacion.cliente || "",
        obra: cotizacion.obra || "",
        observaciones: cotizacion.observaciones || "",
        dolar_referencia: cotizacion.dolar_referencia || "",
        tipo: cotizacion.tipo || "EXTINCION",
        porcentaje_utilidad: cotizacion.porcentaje_utilidad ?? "0",
        aplica_costos_varios: Boolean(cotizacion.aplica_costos_varios),
        porcentaje_costos_varios: cotizacion.porcentaje_costos_varios ?? "0",
        items: (cotizacion.items || []).map((item) => ({
          ...item,
          localId: crypto.randomUUID(),
          id_producto_proveedor: item.id_producto_proveedor || null,
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_unitario),
          total_usd: Number(item.total_usd),
          unidad: item.unidad || "",
        })),
      });
      setCotizacionEditando(false);
    });
  }

  function closeCotizacionModal() {
    setCotizacionSeleccionada(null);
    setCotizacionEdit(null);
    setCotizacionEditando(false);
  }

  function startCotizacionEdit() {
    if (!cotizacionSeleccionada) return;
    setCotizacionEdit({
      ...cotizacionSeleccionada,
      titulo: cotizacionSeleccionada.titulo || "",
      cliente: cotizacionSeleccionada.cliente || "",
      obra: cotizacionSeleccionada.obra || "",
      observaciones: cotizacionSeleccionada.observaciones || "",
      dolar_referencia: cotizacionSeleccionada.dolar_referencia || "",
      tipo: cotizacionSeleccionada.tipo || "EXTINCION",
      porcentaje_utilidad: cotizacionSeleccionada.porcentaje_utilidad ?? "0",
      aplica_costos_varios: Boolean(cotizacionSeleccionada.aplica_costos_varios),
      porcentaje_costos_varios: cotizacionSeleccionada.porcentaje_costos_varios ?? "0",
      items: (cotizacionSeleccionada.items || []).map((item) => ({
        ...item,
        localId: crypto.randomUUID(),
        id_producto_proveedor: item.id_producto_proveedor || null,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        total_usd: Number(item.total_usd),
        unidad: item.unidad || "",
      })),
    });
    setCotizacionEditando(true);
  }

  function cancelCotizacionEdit() {
    startCotizacionEdit();
    setCotizacionEditando(false);
  }

  function updateCotizacionEdit(field, value) {
    setCotizacionEdit((current) => ({ ...current, [field]: value }));
  }

  function updateCotizacionEditItem(localId, field, value) {
    setCotizacionEdit((current) => {
      const dolarReferencia = field === "dolar_referencia" ? value : current.dolar_referencia;
      return {
        ...current,
        items: current.items.map((item) => {
          if (item.localId !== localId) return item;
          const updated = { ...item, [field]: value };
          return {
            ...updated,
            total_usd: itemTotalUsd(updated.cantidad, updated.precio_unitario, updated.moneda, dolarReferencia),
          };
        }),
      };
    });
  }

  function removeCotizacionEditItem(localId) {
    setCotizacionEdit((current) => ({
      ...current,
      items: current.items.filter((item) => item.localId !== localId),
    }));
  }

  async function saveCotizacionEdit() {
    if (!cotizacionEdit?.titulo?.trim()) {
      setError("Carga un titulo para la cotizacion");
      return;
    }
    if (!cotizacionEdit.items?.length) {
      setError("La cotizacion debe tener al menos un item");
      return;
    }
    await run("Cotizacion actualizada", async () => {
      const payload = {
        tipo: cotizacionEdit.tipo || "EXTINCION",
        titulo: cotizacionEdit.titulo,
        cliente: cleanText(cotizacionEdit.cliente),
        obra: cleanText(cotizacionEdit.obra),
        observaciones: cleanText(cotizacionEdit.observaciones),
        dolar_referencia: toNumberOrNull(cotizacionEdit.dolar_referencia),
        ...cotizacionEditResumen,
        items: cotizacionEdit.items.map(({ id: _id, localId: _localId, producto_proveedor: _producto, ...item }) => ({
          id_producto_proveedor: item.id_producto_proveedor || null,
          tipo: item.tipo,
          descripcion: item.descripcion,
          cantidad: toNumber(item.cantidad),
          unidad: cleanText(item.unidad),
          precio_unitario: toNumber(item.precio_unitario),
          moneda: item.moneda,
          total_usd: toNumber(item.total_usd),
        })),
      };
      const updated = await request(apiUrl, `/cotizaciones/${cotizacionEdit.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setCotizacionSeleccionada(updated);
      setCotizacionEdit({
        ...updated,
        titulo: updated.titulo || "",
        cliente: updated.cliente || "",
        obra: updated.obra || "",
        observaciones: updated.observaciones || "",
        dolar_referencia: updated.dolar_referencia || "",
        tipo: updated.tipo || "EXTINCION",
        porcentaje_utilidad: updated.porcentaje_utilidad ?? "0",
        aplica_costos_varios: Boolean(updated.aplica_costos_varios),
        porcentaje_costos_varios: updated.porcentaje_costos_varios ?? "0",
        items: (updated.items || []).map((item) => ({
          ...item,
          localId: crypto.randomUUID(),
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_unitario),
          total_usd: Number(item.total_usd),
          unidad: item.unidad || "",
        })),
      });
      await loadCotizaciones();
      setCotizacionEditando(false);
    });
  }

  async function printCotizacionById(id) {
    await run("Cotizacion lista para PDF", async () => {
      const cotizacion = await request(apiUrl, `/cotizaciones/${id}`);
      setCotizacionSeleccionada(cotizacion);
      printCotizacion(cotizacion);
    });
  }

  function printCotizacion(cotizacion = cotizacionSeleccionada) {
    const result = openCotizacionPdf(cotizacion);
    if (!result.ok) setError(result.error);
  }

  async function softDelete(kind, id) {
    if (kind !== "proveedor") return;
    await run("Proveedor desactivado", async () => {
      await request(apiUrl, `/proveedores/${id}`, { method: "DELETE" });
      await loadBaseData();
    });
  }

  async function loadHistorial(event) {
    event.preventDefault();
    if (!historialId) {
      setError("Selecciona un producto proveedor para consultar precios");
      return;
    }
    await run("Historial cargado", async () => {
      const [historialData, ultimoData] = await Promise.all([
        request(apiUrl, `/productos-proveedor/${historialId}/historial-precios`),
        request(apiUrl, `/productos-proveedor/${historialId}/ultimo-precio`),
      ]);
      setHistorial(historialData);
      setUltimoPrecio(ultimoData);
    });
  }

  async function importarJson(preview) {
    await run(preview ? "Preview validado" : "Importacion procesada", async () => {
      const parsed = JSON.parse(importJson);
      const data = await request(apiUrl, `/importaciones/${importProveedorId}/${preview ? "preview-json" : "procesar-json"}`, {
        method: "POST",
        body: JSON.stringify(parsed),
      });
      setImportResult(data);
      if (!preview) await loadProductosProveedor();
      if (!preview) await loadProductosBusqueda();
    });
  }

  const tabs = [
    ["proveedores", "Proveedores"],
    ["categorias", "Categorias"],
    ["productosProveedor", "Productos"],
    ["cotizaciones", "Cotizaciones"],
    ["historial", "Precios"],
    ["importaciones", "Importacion JSON"],
  ];

  return (
    <main>
      <AppHeader
        apiUrl={apiUrl}
        setApiUrl={setApiUrl}
        checkHealth={checkHealth}
        health={health}
        dolarOficial={dolarOficial}
        dolarError={dolarError}
      />

      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      <Status message={status} error={error} />
      {loading && <div className="loading">Procesando...</div>}

      {activeTab === "proveedores" && (
        <ProveedoresTab
          proveedorForm={proveedorForm}
          setProveedorForm={setProveedorForm}
          editing={editing}
          setEditing={setEditing}
          saveProveedor={saveProveedor}
          proveedorModalOpen={proveedorModalOpen}
          openNuevoProveedorModal={openNuevoProveedorModal}
          closeNuevoProveedorModal={closeNuevoProveedorModal}
          loadBaseData={loadBaseData}
          filters={filters}
          setFilters={setFilters}
          proveedores={proveedores}
          openProveedorModal={openProveedorModal}
          softDelete={softDelete}
        />
      )}

      {activeTab === "categorias" && (
        <CategoriasTab
          categoriaForm={categoriaForm}
          setCategoriaForm={setCategoriaForm}
          subcategoriaForm={subcategoriaForm}
          setSubcategoriaForm={setSubcategoriaForm}
          editing={editing}
          setEditing={setEditing}
          saveCategoria={saveCategoria}
          saveSubcategoria={saveSubcategoria}
          loadBaseData={loadBaseData}
          categorias={categorias}
          subcategorias={subcategorias}
        />
      )}

      {activeTab === "productosProveedor" && (
        <ProductosTab
          productoProveedorForm={productoProveedorForm}
          setProductoProveedorForm={setProductoProveedorForm}
          editing={editing}
          setEditing={setEditing}
          saveProductoProveedor={saveProductoProveedor}
          productoProveedorModalOpen={productoProveedorModalOpen}
          openNuevoProductoModal={openNuevoProductoModal}
          closeNuevoProductoModal={closeNuevoProductoModal}
          proveedores={proveedores}
          categorias={categorias}
          subcategorias={subcategorias}
          subcategoriasProductoProveedor={subcategoriasProductoProveedor}
          filters={filters}
          setFilters={setFilters}
          searchProductosProveedor={searchProductosProveedor}
          productosProveedorMeta={productosProveedorMeta}
          goProductosPage={goProductosPage}
          productosProveedor={productosProveedor}
          openProductoModal={openProductoModal}
        />
      )}

      {activeTab === "cotizaciones" && (
        <CotizacionesTab
          saveCotizacion={saveCotizacion}
          cotizacionForm={cotizacionForm}
          setCotizacionForm={setCotizacionForm}
          setCotizacionItems={setCotizacionItems}
          cotizacionResumen={cotizacionResumen}
          dolarVenta={dolarVenta}
          addProductoCotizacion={addProductoCotizacion}
          cotizacionProducto={cotizacionProducto}
          setCotizacionProducto={setCotizacionProducto}
          setCotizacionDropdownOpen={setCotizacionDropdownOpen}
          proveedores={proveedores}
          productosCotizacion={productosCotizacion}
          cotizacionDropdownOpen={cotizacionDropdownOpen}
          productoCotizacionSeleccionado={productoCotizacionSeleccionado}
          calcularCompraProducto={calcularCompraProducto}
          addManualCotizacion={addManualCotizacion}
          cotizacionManual={cotizacionManual}
          setCotizacionManual={setCotizacionManual}
          addManoObraCotizacion={addManoObraCotizacion}
          cotizacionManoObra={cotizacionManoObra}
          setCotizacionManoObra={setCotizacionManoObra}
          priceToUsd={priceToUsd}
          cotizacionItems={cotizacionItems}
          cotizaciones={cotizaciones}
          loadCotizaciones={loadCotizaciones}
          openCotizacion={openCotizacion}
          printCotizacionById={printCotizacionById}
        />
      )}

      {activeTab === "historial" && (
        <HistorialPreciosTab
          loadHistorial={loadHistorial}
          historialFilters={historialFilters}
          setHistorialFilters={setHistorialFilters}
          proveedores={proveedores}
          productosHistorial={productosHistorial}
          historialId={historialId}
          setHistorialId={setHistorialId}
          historialDropdownOpen={historialDropdownOpen}
          setHistorialDropdownOpen={setHistorialDropdownOpen}
          productoHistorialSeleccionado={productoHistorialSeleccionado}
          ultimoPrecio={ultimoPrecio}
          historial={historial}
        />
      )}

      {activeTab === "importaciones" && (
        <ImportacionesTab
          importProveedorId={importProveedorId}
          setImportProveedorId={setImportProveedorId}
          proveedores={proveedores}
          importJson={importJson}
          setImportJson={setImportJson}
          importarJson={importarJson}
          importResult={importResult}
        />
      )}

      <ProveedorModal
        proveedorSeleccionado={proveedorSeleccionado}
        proveedorEdit={proveedorEdit}
        setProveedorEdit={setProveedorEdit}
        proveedorEditando={proveedorEditando}
        setProveedorEditando={setProveedorEditando}
        closeProveedorModal={closeProveedorModal}
        cancelProveedorEdit={cancelProveedorEdit}
        saveProveedorEdit={saveProveedorEdit}
      />

      <ProductoModal
        productoSeleccionado={productoSeleccionado}
        productoEdit={productoEdit}
        setProductoEdit={setProductoEdit}
        productoEditando={productoEditando}
        setProductoEditando={setProductoEditando}
        closeProductoModal={closeProductoModal}
        cancelProductoEdit={cancelProductoEdit}
        saveProductoEdit={saveProductoEdit}
        proveedores={proveedores}
        categorias={categorias}
        subcategoriasProductoEdit={subcategoriasProductoEdit}
      />

      <CotizacionModal
        cotizacionSeleccionada={cotizacionSeleccionada}
        cotizacionEdit={cotizacionEdit}
        cotizacionEditando={cotizacionEditando}
        closeCotizacionModal={closeCotizacionModal}
        updateCotizacionEdit={updateCotizacionEdit}
        setCotizacionEdit={setCotizacionEdit}
        itemTotalUsd={itemTotalUsd}
        cotizacionEditResumen={cotizacionEditResumen}
        updateCotizacionEditItem={updateCotizacionEditItem}
        removeCotizacionEditItem={removeCotizacionEditItem}
        printCotizacion={printCotizacion}
        cancelCotizacionEdit={cancelCotizacionEdit}
        saveCotizacionEdit={saveCotizacionEdit}
        startCotizacionEdit={startCotizacionEdit}
      />
    </main>
  );
}

export default App;
