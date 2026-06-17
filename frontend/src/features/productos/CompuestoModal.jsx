import React, { useMemo } from "react";
import { Actions, Field, Select, TextInput } from "../../components/ui.jsx";
import { normalizeSearch } from "../../utils/format.js";

export function CompuestoModal({
  open,
  onClose,
  compuestoForm,
  setCompuestoForm,
  compuestoItems,
  compuestoItemForm,
  setCompuestoItemForm,
  saveCompuesto,
  addItemToCompuesto,
  removeItemFromCompuesto,
  editingCompuesto,
  productosBusqueda,
}) {
  if (!open) return null;

  const productosSimples = useMemo(
    () => productosBusqueda.filter((p) => p._tipo !== "COMPUESTO" && p.activo !== false),
    [productosBusqueda],
  );

  const productosFiltrados = useMemo(() => {
    const buscar = normalizeSearch(compuestoItemForm.buscar || "");
    if (!buscar) return productosSimples.slice(0, 30);
    return productosSimples
      .filter((p) =>
        normalizeSearch(`${p.sku_producto_proveedor} ${p.nombre_producto_proveedor} ${p.proveedor?.nombre || ""}`).includes(buscar),
      )
      .slice(0, 30);
  }, [productosSimples, compuestoItemForm.buscar]);

  const productoSeleccionado = useMemo(
    () => productosSimples.find((p) => String(p.id) === String(compuestoItemForm.idProducto)),
    [productosSimples, compuestoItemForm.idProducto],
  );

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <section className="modal quoteModal">
        <div className="modalHead">
          <div>
            <h2>{editingCompuesto ? "Editar compuesto" : "Nuevo compuesto"}</h2>
            <p>Kit de productos que se agregan juntos a una cotizacion</p>
          </div>
          <button type="button" className="secondary" onClick={onClose}>Cerrar</button>
        </div>

        <form onSubmit={saveCompuesto}>
          <div className="modalFormGrid">
            <Field label="Nombre del compuesto">
              <TextInput
                value={compuestoForm.nombre}
                onChange={(nombre) => setCompuestoForm({ ...compuestoForm, nombre })}
                placeholder="Ej: Kit extintor tipo A"
              />
            </Field>
            <Field label="Descripcion (opcional)">
              <TextInput
                value={compuestoForm.descripcion}
                onChange={(descripcion) => setCompuestoForm({ ...compuestoForm, descripcion })}
              />
            </Field>
          </div>

          {/* Item list */}
          <div className="compuestoItemList">
            <strong>Items del compuesto</strong>
            {compuestoItems.length === 0 && (
              <p className="emptyHint">Sin items. Agregá al menos uno.</p>
            )}
            {compuestoItems.map((item, i) => (
              <div key={item.localId} className="compuestoItemRow">
                <span className="compuestoItemIndex">{i + 1}</span>
                <span className="compuestoItemDesc">
                  {item.tipo === "PRODUCTO"
                    ? productosSimples.find((p) => p.id === item.id_producto_proveedor)?.nombre_producto_proveedor || `Producto #${item.id_producto_proveedor}`
                    : item.descripcion}
                </span>
                <span className="compuestoItemQty">x {item.cantidad} {item.unidad || ""}</span>
                {item.tipo === "MANUAL" && item.precio_unitario !== null && (
                  <span className="compuestoItemPrice">{item.moneda} {item.precio_unitario}</span>
                )}
                <button type="button" className="secondary small" onClick={() => removeItemFromCompuesto(item.localId)}>✕</button>
              </div>
            ))}
          </div>

          {/* Add item form */}
          <div className="inlineForm">
            <strong>Agregar item</strong>
            <div className="modalFormGrid" style={{ marginTop: 10 }}>
              <Field label="Tipo">
                <Select
                  value={compuestoItemForm.tipo}
                  onChange={(tipo) => setCompuestoItemForm({ ...compuestoItemForm, tipo, idProducto: "", buscar: "", descripcion: "", precio_unitario: "", moneda: "USD" })}
                >
                  <option value="PRODUCTO">Producto de proveedor</option>
                  <option value="MANUAL">Item manual</option>
                </Select>
              </Field>

              {compuestoItemForm.tipo === "PRODUCTO" ? (
                <>
                  <Field label="Buscar producto">
                    <TextInput
                      value={compuestoItemForm.buscar}
                      onChange={(buscar) => setCompuestoItemForm({ ...compuestoItemForm, buscar, idProducto: "" })}
                      placeholder="SKU o nombre..."
                    />
                  </Field>
                  {compuestoItemForm.buscar && !compuestoItemForm.idProducto && (
                    <div className="compuestoProductResults" style={{ gridColumn: "1 / -1" }}>
                      {productosFiltrados.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="compuestoProductResult"
                          onClick={() => setCompuestoItemForm({ ...compuestoItemForm, idProducto: String(p.id), descripcion: p.nombre_producto_proveedor, buscar: `${p.sku_producto_proveedor} - ${p.nombre_producto_proveedor}` })}
                        >
                          <span>{p.sku_producto_proveedor} · {p.nombre_producto_proveedor}</span>
                          <span className="emptyHint">{p.proveedor?.nombre}</span>
                        </button>
                      ))}
                      {productosFiltrados.length === 0 && <p className="emptyHint">Sin resultados</p>}
                    </div>
                  )}
                  {productoSeleccionado && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <p><strong>Seleccionado:</strong> {productoSeleccionado.sku_producto_proveedor} — {productoSeleccionado.nombre_producto_proveedor}</p>
                    </div>
                  )}
                </>
              ) : (
                <Field label="Descripcion">
                  <TextInput
                    value={compuestoItemForm.descripcion}
                    onChange={(descripcion) => setCompuestoItemForm({ ...compuestoItemForm, descripcion })}
                    placeholder="Descripcion del item manual"
                  />
                </Field>
              )}

              <Field label="Cantidad">
                <TextInput
                  type="number"
                  value={compuestoItemForm.cantidad}
                  onChange={(cantidad) => setCompuestoItemForm({ ...compuestoItemForm, cantidad })}
                />
              </Field>

              {compuestoItemForm.tipo === "MANUAL" && (
                <Field label="Unidad">
                  <TextInput
                    value={compuestoItemForm.unidad}
                    onChange={(unidad) => setCompuestoItemForm({ ...compuestoItemForm, unidad })}
                    placeholder="unid, m, gl..."
                  />
                </Field>
              )}

              {compuestoItemForm.tipo === "MANUAL" && (
                <>
                  <Field label="Precio unitario">
                    <TextInput
                      type="number"
                      value={compuestoItemForm.precio_unitario}
                      onChange={(precio_unitario) => setCompuestoItemForm({ ...compuestoItemForm, precio_unitario })}
                    />
                  </Field>
                  <Field label="Moneda">
                    <Select
                      value={compuestoItemForm.moneda}
                      onChange={(moneda) => setCompuestoItemForm({ ...compuestoItemForm, moneda })}
                    >
                      <option>USD</option>
                      <option>ARS</option>
                    </Select>
                  </Field>
                </>
              )}
            </div>
            <Actions>
              <button type="button" onClick={addItemToCompuesto}>+ Agregar item</button>
            </Actions>
          </div>

          <Actions>
            <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
            <button type="submit">{editingCompuesto ? "Guardar cambios" : "Crear compuesto"}</button>
          </Actions>
        </form>
      </section>
    </div>
  );
}
