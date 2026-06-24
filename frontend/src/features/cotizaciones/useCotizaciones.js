import { useMemo, useState } from "react";
import { request } from "../../api/client.js";
import {
  emptyCotizacionForm,
  emptyCotizacionManual,
  emptyCotizacionManoObra,
  emptyCotizacionProducto,
} from "../../constants/forms.js";
import { calcularResumenCotizacion } from "./calculos.js";
import { openCotizacionPdf } from "./cotizacionPdf.js";
import { calcularCompraProducto, describirCompraProducto } from "./unidades.js";
import { cleanText, normalizeSearch, toNumber, toNumberOrNull } from "../../utils/format.js";

export function useCotizaciones({ apiUrl, run, setError, dolarVenta, productosBusqueda }) {
  const [cotizacionForm, setCotizacionForm] = useState(emptyCotizacionForm);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [cotizacionProducto, setCotizacionProducto] = useState(emptyCotizacionProducto);
  const [cotizacionManual, setCotizacionManual] = useState(emptyCotizacionManual);
  const [cotizacionManoObra, setCotizacionManoObra] = useState(emptyCotizacionManoObra);
  const [cotizacionItems, setCotizacionItems] = useState([]);
  const [cotizacionDropdownOpen, setCotizacionDropdownOpen] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [accesoriosAutomaticos, setAccesoriosAutomaticos] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [cotizacionEdit, setCotizacionEdit] = useState(null);
  const [cotizacionEditando, setCotizacionEditando] = useState(false);
  const [cotizacionEditId, setCotizacionEditId] = useState(null);
  const [cotizacionWizardOpen, setCotizacionWizardOpen] = useState(false);

  const cotizacionCostoDirectoUsd = useMemo(
    () => cotizacionItems.reduce((total, item) => total + toNumber(item.total_usd), 0),
    [cotizacionItems],
  );

  const cotizacionResumen = useMemo(
    () =>
      calcularResumenCotizacion(
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
    () =>
      calcularResumenCotizacion(
        cotizacionEditCostoDirectoUsd,
        cotizacionEdit?.porcentaje_utilidad,
        cotizacionEdit?.aplica_costos_varios,
        cotizacionEdit?.porcentaje_costos_varios,
      ),
    [cotizacionEditCostoDirectoUsd, cotizacionEdit],
  );

  const cotizacionesFiltradas = useMemo(() => {
    const q = normalizeSearch(searchQuery);
    return cotizaciones.filter((c) => {
      if (estadoFiltro && c.estado !== estadoFiltro) return false;
      if (!q) return true;
      return (
        normalizeSearch(c.titulo).includes(q) ||
        normalizeSearch(c.cliente).includes(q) ||
        normalizeSearch(c.obra).includes(q)
      );
    });
  }, [cotizaciones, estadoFiltro, searchQuery]);

  const productosCotizacion = useMemo(() => {
    const buscar = normalizeSearch(cotizacionProducto.buscar);
    return productosBusqueda.filter((item) => {
      // Composite products do not belong to a provider, but they can be filtered by category.
      if (item._tipo === "COMPUESTO") {
        if (item.activo === false) return false;
        const coincideCategoria =
          !cotizacionProducto.idCategoria || String(item.id_categoria) === String(cotizacionProducto.idCategoria);
        const coincideSubcategoria =
          !cotizacionProducto.idSubcategoria || String(item.id_subcategoria) === String(cotizacionProducto.idSubcategoria);
        if (!coincideCategoria || !coincideSubcategoria) return false;
        if (!buscar) return true;
        return normalizeSearch(item.nombre || "").includes(buscar);
      }
      // Regular products
      const coincideProveedor =
        !cotizacionProducto.idProveedor || String(item.id_proveedor) === String(cotizacionProducto.idProveedor);
      const coincideCategoria =
        !cotizacionProducto.idCategoria || String(item.id_categoria) === String(cotizacionProducto.idCategoria);
      const coincideSubcategoria =
        !cotizacionProducto.idSubcategoria || String(item.id_subcategoria) === String(cotizacionProducto.idSubcategoria);
      const proveedorActivo = item.proveedor?.activo !== false;
      const coincideTipo =
        !cotizacionForm.tipo ||
        !item.proveedor?.tipo ||
        item.proveedor.tipo === "AMBOS" ||
        item.proveedor.tipo === cotizacionForm.tipo;
      const texto = normalizeSearch(
        `${item.sku_producto_proveedor} ${item.nombre_producto_proveedor} ${item.proveedor?.nombre || ""}`,
      );
      return proveedorActivo && coincideProveedor && coincideCategoria && coincideSubcategoria && coincideTipo && (!buscar || texto.includes(buscar));
    });
  }, [cotizacionProducto, cotizacionForm, productosBusqueda]);

  const productoCotizacionSeleccionado = useMemo(
    () => productosBusqueda.find((item) => String(item.id) === String(cotizacionProducto.idProducto)),
    [cotizacionProducto.idProducto, productosBusqueda],
  );

  function priceToUsd(precio, moneda) {
    const value = toNumber(precio);
    if (moneda === "USD") return value;
    if (!dolarVenta) return 0;
    return value / dolarVenta;
  }

  function accessoryQuantity(formula, meters, separacionMaxima) {
    if (formula === "PERA") {
      const separacion = toNumber(separacionMaxima);
      if (separacion <= 0) return null;
      return Math.ceil(meters / separacion) + 1;
    }
    if (formula === "SOPORTE") return Math.ceil(meters / 3.5);
    return Math.ceil(meters / 6.4);
  }

  function itemTotalUsd(cantidad, precioUnitario, moneda, dolarReferencia = dolarVenta) {
    const cantidadNumber = toNumber(cantidad);
    const precioNumber = toNumber(precioUnitario);
    if (moneda === "USD") return cantidadNumber * precioNumber;
    const dolarNumber = toNumber(dolarReferencia);
    return dolarNumber ? (cantidadNumber * precioNumber) / dolarNumber : 0;
  }

  function toDateInputValue(value) {
    if (!value) return emptyCotizacionForm.fecha_emision;
    return String(value).slice(0, 10);
  }

  function mapCotizacionToForm(cotizacion) {
    return {
      ...emptyCotizacionForm,
      tipo: cotizacion.tipo || emptyCotizacionForm.tipo,
      titulo: cotizacion.titulo || "",
      cliente: cotizacion.cliente || "",
      contacto_cliente: cotizacion.contacto_cliente || "",
      cuit_cliente: cotizacion.cuit_cliente || "",
      email_cliente: cotizacion.email_cliente || "",
      obra: cotizacion.obra || "",
      fecha_emision: toDateInputValue(cotizacion.fecha_emision),
      validez_dias: String(cotizacion.validez_dias || emptyCotizacionForm.validez_dias),
      moneda_base: cotizacion.moneda_base || emptyCotizacionForm.moneda_base,
      observaciones: cotizacion.observaciones || "",
      porcentaje_utilidad: String(cotizacion.porcentaje_utilidad ?? emptyCotizacionForm.porcentaje_utilidad),
      aplica_costos_varios: Boolean(cotizacion.aplica_costos_varios),
      porcentaje_costos_varios: String(cotizacion.porcentaje_costos_varios ?? emptyCotizacionForm.porcentaje_costos_varios),
    };
  }

  function mapCotizacionItemsToDraft(items = []) {
    return items.map((item) => ({
      localId: crypto.randomUUID(),
      id_producto_proveedor: item.id_producto_proveedor || null,
      tipo: item.tipo,
      grupo: item.descripcion?.toLowerCase().startsWith("mano de obra") ? "MANO_OBRA" : "MATERIAL",
      descripcion: item.descripcion || "",
      cantidad: Number(item.cantidad),
      unidad: item.unidad || "",
      precio_unitario: Number(item.precio_unitario),
      moneda: item.moneda || "USD",
      total_usd: Number(item.total_usd),
      metros_requeridos: item.metros_requeridos == null ? null : Number(item.metros_requeridos),
      generado_automaticamente: Boolean(item.generado_automaticamente),
      formula_automatica: item.formula_automatica || null,
    }));
  }

  function clearCotizacionDraft() {
    setCotizacionForm(emptyCotizacionForm);
    setCotizacionItems([]);
    setCotizacionProducto(emptyCotizacionProducto);
    setCotizacionEditId(null);
  }

  async function loadCotizaciones() {
    await run("Cotizaciones actualizadas", async () => {
      setCotizaciones(await request(apiUrl, "/cotizaciones"));
    });
  }

  async function loadAccesoriosAutomaticos() {
    await run("Accesorios automaticos actualizados", async () => {
      setAccesoriosAutomaticos(await request(apiUrl, "/productos-accesorios-automaticos"));
    });
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
    const unitUsd = priceToUsd(
      productoCotizacionSeleccionado.precio_actual,
      productoCotizacionSeleccionado.moneda_actual,
    );
    const isTube = normalizeSearch(productoCotizacionSeleccionado.unidad) === "tubo";
    const detalleCompra = describirCompraProducto(productoCotizacionSeleccionado, cantidadRequerida);
    const metrosCotizados = isTube
      ? compra.cantidadCompra * compra.equivalencia
      : cantidadRequerida;
    const localId = crypto.randomUUID();
    const nuevosItems = [
      {
        localId,
        id_producto_proveedor: productoCotizacionSeleccionado.id,
        tipo: "PRODUCTO",
        descripcion: [
          `${productoCotizacionSeleccionado.sku_producto_proveedor} - ${productoCotizacionSeleccionado.nombre_producto_proveedor}`,
          detalleCompra,
          isTube ? `Precio calculado sobre ${metrosCotizados.toLocaleString("es-AR")} m cotizados` : null,
        ]
          .filter(Boolean)
          .join(" | "),
        cantidad: isTube ? metrosCotizados : compra.cantidadCompra,
        unidad: isTube ? "mts" : productoCotizacionSeleccionado.unidad || "",
        precio_unitario: toNumber(productoCotizacionSeleccionado.precio_actual),
        moneda: productoCotizacionSeleccionado.moneda_actual,
        total_usd: (isTube ? metrosCotizados : compra.cantidadCompra) * unitUsd,
        metros_requeridos: isTube ? cantidadRequerida : null,
      },
    ];

    if (isTube) {
      const configs = accesoriosAutomaticos.filter(
        (config) => config.activo && String(config.id_producto_tubo) === String(productoCotizacionSeleccionado.id),
      );
      for (const config of configs) {
        const accesorio = config.producto_accesorio;
        if (!accesorio) return setError("Hay un accesorio automatico sin producto configurado");
        if (!accesorio.precio_actual || !accesorio.moneda_actual) return setError(`El accesorio ${accesorio.nombre_producto_proveedor} no tiene precio actual`);
        if (accesorio.moneda_actual === "ARS" && !dolarVenta) return setError("No hay cotizacion de dolar disponible para convertir pesos a USD");
        const cantidadAccesorio = accessoryQuantity(config.formula, metrosCotizados, config.separacion_maxima_m);
        if (!cantidadAccesorio || cantidadAccesorio <= 0) return setError(config.formula === "PERA" ? "La formula PERA requiere una separacion maxima mayor a cero" : `No se pudo calcular ${config.formula}`);
        const precioAccesorio = toNumber(accesorio.precio_actual);
        nuevosItems.push({
          localId: crypto.randomUUID(),
          id_producto_proveedor: accesorio.id,
          tipo: "PRODUCTO",
          descripcion: `${accesorio.sku_producto_proveedor} - ${accesorio.nombre_producto_proveedor} | Automatico ${config.formula} para ${metrosCotizados.toLocaleString("es-AR")} m cotizados`,
          cantidad: cantidadAccesorio,
          unidad: accesorio.unidad || "",
          precio_unitario: precioAccesorio,
          moneda: accesorio.moneda_actual,
          total_usd: cantidadAccesorio * priceToUsd(precioAccesorio, accesorio.moneda_actual),
          generado_automaticamente: true,
          formula_automatica: config.formula,
          accesorio_origen_local_id: localId,
        });
      }
    }

    setCotizacionItems((items) => [...items, ...nuevosItems]);
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
      return false;
    }
    if (!cotizacionItems.length) {
      setError("Agrega al menos un item a la cotizacion");
      return false;
    }
    const saved = await run(cotizacionEditId ? "Cotizacion actualizada" : "Cotizacion guardada", async () => {
      await request(apiUrl, cotizacionEditId ? `/cotizaciones/${cotizacionEditId}` : "/cotizaciones", {
        method: cotizacionEditId ? "PUT" : "POST",
        body: JSON.stringify({
          ...cotizacionForm,
          cliente: cleanText(cotizacionForm.cliente),
          contacto_cliente: cleanText(cotizacionForm.contacto_cliente),
          cuit_cliente: cleanText(cotizacionForm.cuit_cliente),
          email_cliente: cleanText(cotizacionForm.email_cliente),
          obra: cleanText(cotizacionForm.obra),
          observaciones: cleanText(cotizacionForm.observaciones),
          dolar_referencia: dolarVenta || null,
          ...cotizacionResumen,
          items: cotizacionItems.map(({ localId: _localId, grupo: _grupo, ...item }) => item),
        }),
      });
      clearCotizacionDraft();
      await loadCotizaciones();
      return true;
    });
    return Boolean(saved);
  }

  async function loadCotizacionIntoWizard(id) {
    const loaded = await run("Cotizacion cargada para editar", async () => {
      const cotizacion = await request(apiUrl, `/cotizaciones/${id}`);
      setCotizacionEditId(cotizacion.id);
      setCotizacionForm(mapCotizacionToForm(cotizacion));
      setCotizacionItems(mapCotizacionItemsToDraft(cotizacion.items));
      setCotizacionProducto(emptyCotizacionProducto);
      setError("");
      return true;
    });
    return Boolean(loaded);
  }

  async function editCotizacionInWizard(id = cotizacionSeleccionada?.id) {
    if (!id) return;
    const loaded = await loadCotizacionIntoWizard(id);
    if (!loaded) return;
    closeCotizacionModal();
    setCotizacionWizardOpen(true);
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
          metros_requeridos: item.metros_requeridos == null ? null : Number(item.metros_requeridos),
          generado_automaticamente: Boolean(item.generado_automaticamente),
          formula_automatica: item.formula_automatica || null,
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
        metros_requeridos: item.metros_requeridos == null ? null : Number(item.metros_requeridos),
        generado_automaticamente: Boolean(item.generado_automaticamente),
        formula_automatica: item.formula_automatica || null,
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
        items: cotizacionEdit.items.map(
          ({ id: _id, localId: _localId, producto_proveedor: _producto, ...item }) => ({
            id_producto_proveedor: item.id_producto_proveedor || null,
            tipo: item.tipo,
            descripcion: item.descripcion,
            cantidad: toNumber(item.cantidad),
            unidad: cleanText(item.unidad),
            precio_unitario: toNumber(item.precio_unitario),
            moneda: item.moneda,
            total_usd: toNumber(item.total_usd),
            metros_requeridos: toNumberOrNull(item.metros_requeridos),
            generado_automaticamente: Boolean(item.generado_automaticamente),
            formula_automatica: item.formula_automatica || null,
          }),
        ),
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
          metros_requeridos: item.metros_requeridos == null ? null : Number(item.metros_requeridos),
          generado_automaticamente: Boolean(item.generado_automaticamente),
          formula_automatica: item.formula_automatica || null,
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

  async function updateCotizacionStatus(id, estado) {
    setUpdatingStatus(true);
    try {
      const updated = await request(apiUrl, `/cotizaciones/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      setCotizaciones((current) => current.map((c) => (c.id === id ? { ...c, estado: updated.estado } : c)));
      setCotizacionSeleccionada((current) => (current?.id === id ? updated : current));
    } catch (err) {
      setError(err?.message || "Error al actualizar el estado");
    } finally {
      setUpdatingStatus(false);
    }
  }

  return {
    cotizacionForm,
    setCotizacionForm,
    cotizacionProducto,
    setCotizacionProducto,
    cotizacionManual,
    setCotizacionManual,
    cotizacionManoObra,
    setCotizacionManoObra,
    cotizacionItems,
    setCotizacionItems,
    cotizacionDropdownOpen,
    setCotizacionDropdownOpen,
    cotizaciones,
    accesoriosAutomaticos,
    cotizacionSeleccionada,
    cotizacionEdit,
    setCotizacionEdit,
    cotizacionEditando,
    cotizacionEditId,
    cotizacionWizardOpen,
    setCotizacionWizardOpen,
    cotizacionResumen,
    cotizacionEditResumen,
    productosCotizacion,
    productoCotizacionSeleccionado,
    priceToUsd,
    itemTotalUsd,
    loadCotizaciones,
    loadAccesoriosAutomaticos,
    addProductoCotizacion,
    addManualCotizacion,
    addManoObraCotizacion,
    saveCotizacion,
    loadCotizacionIntoWizard,
    editCotizacionInWizard,
    clearCotizacionDraft,
    openCotizacion,
    closeCotizacionModal,
    startCotizacionEdit,
    cancelCotizacionEdit,
    updateCotizacionEdit,
    updateCotizacionEditItem,
    removeCotizacionEditItem,
    saveCotizacionEdit,
    printCotizacionById,
    printCotizacion,
    estadoFiltro,
    setEstadoFiltro,
    searchQuery,
    setSearchQuery,
    cotizacionesFiltradas,
    updatingStatus,
    updateCotizacionStatus,
  };
}
