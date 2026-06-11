import React from "react";
import { Actions, Field, Select, TextInput } from "../../components/ui.jsx";
import { formatDate, formatMoney } from "../../utils/format.js";

export function HistorialPreciosTab({
  loadHistorial,
  historialFilters,
  setHistorialFilters,
  proveedores,
  productosHistorial,
  historialId,
  setHistorialId,
  historialDropdownOpen,
  setHistorialDropdownOpen,
  productoHistorialSeleccionado,
  ultimoPrecio,
  historial,
}) {
  return (
    <section className="legacyGrid">
      <form className="panel" onSubmit={loadHistorial}>
        <h2>Consultar precios</h2>
        <Field label="Proveedor"><Select value={historialFilters.idProveedor} onChange={(idProveedor) => { setHistorialFilters({ ...historialFilters, idProveedor }); setHistorialId(""); }}><option value="">Todos</option>{proveedores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
        <div className="field">
          <span>Producto proveedor ({productosHistorial.length})</span>
          <div className="autocomplete">
            <TextInput
              value={historialFilters.buscar}
              onChange={(buscar) => {
                setHistorialFilters({ ...historialFilters, buscar });
                setHistorialId("");
                setHistorialDropdownOpen(true);
              }}
              placeholder="Escribi SKU, nombre o proveedor"
            />
            <button type="button" className="autocompleteToggle" onClick={() => setHistorialDropdownOpen((value) => !value)} aria-label="Mostrar resultados">v</button>
            {historialDropdownOpen && (
              <div className="searchResults">
                {productosHistorial.slice(0, 12).map((item) => (
                  <button
                    type="button"
                    className={String(historialId) === String(item.id) ? "searchResult selected" : "searchResult"}
                    key={item.id}
                    onClick={() => {
                      setHistorialId(String(item.id));
                      setHistorialFilters({
                        ...historialFilters,
                        buscar: `${item.sku_producto_proveedor} - ${item.nombre_producto_proveedor}`,
                      });
                      setHistorialDropdownOpen(false);
                    }}
                  >
                    <strong>{item.sku_producto_proveedor}</strong>
                    <span>{item.nombre_producto_proveedor}</span>
                    <small>{item.proveedor?.nombre || "Sin proveedor"}</small>
                  </button>
                ))}
                {!productosHistorial.length && <div className="emptyResults">Sin coincidencias</div>}
              </div>
            )}
          </div>
        </div>
        {productoHistorialSeleccionado && (
          <div className="selectedProduct">
            <strong>Seleccionado</strong>
            <span>{productoHistorialSeleccionado.sku_producto_proveedor} - {productoHistorialSeleccionado.nombre_producto_proveedor}</span>
          </div>
        )}
        <Actions><button type="submit">Consultar</button></Actions>
        {ultimoPrecio && <div className="summary"><strong>Ultimo precio</strong><span>{formatMoney(ultimoPrecio.precio, ultimoPrecio.moneda)}</span><small>{formatDate(ultimoPrecio.fecha_actualizada)}</small></div>}
      </form>
      <section className="panel wide">
        <h2>Historial</h2>
        <table><thead><tr><th>ID</th><th>Precio</th><th>Moneda</th><th>Fecha</th></tr></thead><tbody>
          {historial.map((item) => <tr key={item.id}><td>{item.id}</td><td>{formatMoney(item.precio, item.moneda)}</td><td>{item.moneda}</td><td>{formatDate(item.fecha_actualizada)}</td></tr>)}
        </tbody></table>
      </section>
    </section>
  );
}
