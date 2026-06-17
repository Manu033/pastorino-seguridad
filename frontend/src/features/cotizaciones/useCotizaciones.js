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
  const [cotizacionProducto, setCotizacionProducto] = useState(emptyCotizacionProducto);
  const [cotizacionManual, setCotizacionManual] = useState(emptyCotizacionManual);
  const [cotizacionManoObra, setCotizacionManoObra] = useState(emptyCotizacionManoObra);
  const [cotizacionItems, setCotizacionItems] = useState([]);
  const [cotizacionDropdownOpen, setCotizacionDropdownOpen] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [cotizacionEdit, setCotizacionEdit] = useState(null);
  const [cotizacionEditando, setCotizacionEditando] = useState(false);

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

  const productosCotizacion = useMemo(() => {
    const buscar = normalizeSearch(cotizacionProducto.buscar);
    return productosBusqueda.filter((item) => {
      // Composite products: only filter by text search, ignore proveedor/categoria/tipo filters
      if (item._tipo === "COMPUESTO") {
        if (item.activo === false) return false;
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

  function itemTotalUsd(cantidad, precioUnitario, moneda, dolarReferencia = dolarVenta) {
    const cantidadNumber = toNumber(cantidad);
    const precioNumber = toNumber(precioUnitario);
    if (moneda === "USD") return cantidadNumber * precioNumber;
    const dolarNumber = toNumber(dolarReferencia);
    return dolarNumber ? (cantidadNumber * precioNumber) / dolarNumber : 0;
  }

  async function loadCotizaciones() {
    await run("Cotizaciones actualizadas", async () => {
      setCotizaciones(await request(apiUrl, "/cotizaciones"));
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
        ]
          .filter(Boolean)
          .join(" | "),
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
    cotizacionSeleccionada,
    cotizacionEdit,
    setCotizacionEdit,
    cotizacionEditando,
    cotizacionResumen,
    cotizacionEditResumen,
    productosCotizacion,
    productoCotizacionSeleccionado,
    priceToUsd,
    itemTotalUsd,
    loadCotizaciones,
    addProductoCotizacion,
    addManualCotizacion,
    addManoObraCotizacion,
    saveCotizacion,
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
  };
}
