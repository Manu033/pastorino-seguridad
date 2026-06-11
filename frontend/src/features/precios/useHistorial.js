import { useMemo, useState } from "react";
import { request } from "../../api/client.js";
import { normalizeSearch } from "../../utils/format.js";

export function useHistorial({ apiUrl, run, setError, productosBusqueda }) {
  const [historial, setHistorial] = useState([]);
  const [ultimoPrecio, setUltimoPrecio] = useState(null);
  const [historialId, setHistorialId] = useState("");
  const [historialFilters, setHistorialFilters] = useState({ buscar: "", idProveedor: "" });
  const [historialDropdownOpen, setHistorialDropdownOpen] = useState(false);

  const productosHistorial = useMemo(() => {
    const buscar = normalizeSearch(historialFilters.buscar);
    return productosBusqueda.filter((item) => {
      const coincideProveedor =
        !historialFilters.idProveedor || String(item.id_proveedor) === String(historialFilters.idProveedor);
      const texto = normalizeSearch(
        `${item.sku_producto_proveedor} ${item.nombre_producto_proveedor} ${item.proveedor?.nombre || ""}`,
      );
      const coincideBusqueda = !buscar || texto.includes(buscar);
      return coincideProveedor && coincideBusqueda;
    });
  }, [historialFilters, productosBusqueda]);

  const productoHistorialSeleccionado = useMemo(
    () => productosBusqueda.find((item) => String(item.id) === String(historialId)),
    [historialId, productosBusqueda],
  );

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

  return {
    historial,
    ultimoPrecio,
    historialId,
    setHistorialId,
    historialFilters,
    setHistorialFilters,
    historialDropdownOpen,
    setHistorialDropdownOpen,
    productosHistorial,
    productoHistorialSeleccionado,
    loadHistorial,
  };
}
