import React from "react";
import { Checkbox, Field, Select, TextInput } from "../../components/ui.jsx";
import { formatDate, formatMoney } from "../../utils/format.js";

function QuoteBreakdown({ resumen }) {
  return (
    <div className="summary quoteTotal quoteBreakdown">
      <div><strong>Costo directo de obra</strong><span>{formatMoney(resumen.costo_directo_usd, "USD")}</span></div>
      <div><strong>Utilidad {Number(resumen.porcentaje_utilidad || 0).toLocaleString("es-AR")}%</strong><span>{formatMoney(resumen.monto_utilidad_usd, "USD")}</span></div>
      <div><strong>Subtotal</strong><span>{formatMoney(resumen.subtotal_usd, "USD")}</span></div>
      <div><strong>Costos varios {Number(resumen.porcentaje_costos_varios || 0).toLocaleString("es-AR")}%</strong><span>{formatMoney(resumen.monto_costos_varios_usd, "USD")}</span></div>
      <div className="quoteSalePrice"><strong>Precio de venta</strong><span>{formatMoney(resumen.total_usd, "USD")} +IVA</span></div>
    </div>
  );
}

export function CotizacionModal({
  cotizacionSeleccionada,
  cotizacionEdit,
  cotizacionEditando,
  closeCotizacionModal,
  updateCotizacionEdit,
  setCotizacionEdit,
  itemTotalUsd,
  cotizacionEditResumen,
  updateCotizacionEditItem,
  removeCotizacionEditItem,
  printCotizacion,
  cancelCotizacionEdit,
  saveCotizacionEdit,
  startCotizacionEdit,
}) {
  if (!cotizacionSeleccionada || !cotizacionEdit) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <section className="modal quoteModal">
        <div className="modalHead">
          <div>
            <h2>{cotizacionEditando ? "Editar cotizacion" : cotizacionSeleccionada.titulo}</h2>
            <p>Cotizacion #{cotizacionSeleccionada.id} - {formatDate(cotizacionSeleccionada.creada_en)}</p>
          </div>
          <button type="button" className="secondary" onClick={closeCotizacionModal}>Cerrar</button>
        </div>

        {cotizacionEditando ? (
          <>
            <div className="modalFormGrid">
              <div className="field">
                <span>Tipo de cotizacion</span>
                <div className="quoteTypePicker">
                  <button
                    type="button"
                    className={cotizacionEdit.tipo === "EXTINCION" ? "active" : ""}
                    onClick={() => updateCotizacionEdit("tipo", "EXTINCION")}
                  >
                    Extincion
                  </button>
                  <button type="button" disabled>
                    Deteccion <small>Proximamente</small>
                  </button>
                </div>
              </div>
              <Field label="Titulo"><TextInput value={cotizacionEdit.titulo} onChange={(titulo) => updateCotizacionEdit("titulo", titulo)} /></Field>
              <Field label="Cliente"><TextInput value={cotizacionEdit.cliente} onChange={(cliente) => updateCotizacionEdit("cliente", cliente)} /></Field>
              <Field label="Obra"><TextInput value={cotizacionEdit.obra} onChange={(obra) => updateCotizacionEdit("obra", obra)} /></Field>
              <Field label="Dolar referencia">
                <TextInput
                  type="number"
                  value={cotizacionEdit.dolar_referencia}
                  onChange={(dolar_referencia) => {
                    setCotizacionEdit((current) => ({
                      ...current,
                      dolar_referencia,
                      items: current.items.map((item) => ({
                        ...item,
                        total_usd: itemTotalUsd(item.cantidad, item.precio_unitario, item.moneda, dolar_referencia),
                      })),
                    }));
                  }}
                />
              </Field>
            </div>

            <Field label="Observaciones"><textarea value={cotizacionEdit.observaciones} onChange={(event) => updateCotizacionEdit("observaciones", event.target.value)} /></Field>

            <div className="quoteEditAdjustments">
              <Field label="Utilidad %"><TextInput type="number" value={cotizacionEdit.porcentaje_utilidad} onChange={(porcentaje_utilidad) => updateCotizacionEdit("porcentaje_utilidad", porcentaje_utilidad)} /></Field>
              <Checkbox checked={cotizacionEdit.aplica_costos_varios} onChange={(aplica_costos_varios) => updateCotizacionEdit("aplica_costos_varios", aplica_costos_varios)} label="Aplicar costos varios" />
              {cotizacionEdit.aplica_costos_varios && (
                <Field label="Costos varios %"><TextInput type="number" value={cotizacionEdit.porcentaje_costos_varios} onChange={(porcentaje_costos_varios) => updateCotizacionEdit("porcentaje_costos_varios", porcentaje_costos_varios)} /></Field>
              )}
            </div>

            <QuoteBreakdown resumen={cotizacionEditResumen} />

            <div className="wide">
              <table className="editableTable"><thead><tr><th>Tipo</th><th>Descripcion</th><th>Cant.</th><th>Unidad</th><th>Precio</th><th>Moneda</th><th>Total USD</th><th></th></tr></thead><tbody>
                {(cotizacionEdit.items || []).map((item) => (
                  <tr key={item.localId}>
                    <td>{item.tipo}</td>
                    <td><TextInput value={item.descripcion} onChange={(descripcion) => updateCotizacionEditItem(item.localId, "descripcion", descripcion)} /></td>
                    <td><TextInput type="number" value={item.cantidad} onChange={(cantidad) => updateCotizacionEditItem(item.localId, "cantidad", cantidad)} /></td>
                    <td><TextInput value={item.unidad} onChange={(unidad) => updateCotizacionEditItem(item.localId, "unidad", unidad)} /></td>
                    <td><TextInput type="number" value={item.precio_unitario} onChange={(precio_unitario) => updateCotizacionEditItem(item.localId, "precio_unitario", precio_unitario)} /></td>
                    <td><Select value={item.moneda} onChange={(moneda) => updateCotizacionEditItem(item.localId, "moneda", moneda)}><option>ARS</option><option>USD</option></Select></td>
                    <td>{formatMoney(item.total_usd, "USD")}</td>
                    <td className="rowActions"><button type="button" className="danger" onClick={() => removeCotizacionEditItem(item.localId)}>Quitar</button></td>
                  </tr>
                ))}
                {!cotizacionEdit.items?.length && <tr><td colSpan="8">Sin items cargados</td></tr>}
              </tbody></table>
            </div>
          </>
        ) : (
          <>
            <div className="quoteMeta">
              <div><strong>Tipo</strong><span>{cotizacionSeleccionada.tipo === "DETECCION" ? "Deteccion" : "Extincion"}</span></div>
              <div><strong>Cliente</strong><span>{cotizacionSeleccionada.cliente || "-"}</span></div>
              <div><strong>Obra</strong><span>{cotizacionSeleccionada.obra || "-"}</span></div>
              <div><strong>Dolar referencia</strong><span>{formatMoney(cotizacionSeleccionada.dolar_referencia, "ARS")}</span></div>
              <div><strong>Precio de venta</strong><span>{formatMoney(cotizacionSeleccionada.total_usd, "USD")} +IVA</span></div>
            </div>

            <QuoteBreakdown resumen={cotizacionSeleccionada} />

            {cotizacionSeleccionada.observaciones && (
              <div className="quoteNotes">
                <strong>Observaciones</strong>
                <p>{cotizacionSeleccionada.observaciones}</p>
              </div>
            )}

            <div className="wide">
              <table><thead><tr><th>Tipo</th><th>Descripcion</th><th>Cant.</th><th>Precio</th><th>Total USD</th></tr></thead><tbody>
                {(cotizacionSeleccionada.items || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.tipo}</td>
                    <td>{item.descripcion}</td>
                    <td>{Number(item.cantidad).toLocaleString("es-AR")} {item.unidad}</td>
                    <td>{formatMoney(item.precio_unitario, item.moneda)}</td>
                    <td>{formatMoney(item.total_usd, "USD")}</td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          </>
        )}

        <div className="modalFooter">
          <button type="button" className="secondary" onClick={closeCotizacionModal}>Cerrar</button>
          <button type="button" className="secondary" onClick={() => printCotizacion(cotizacionSeleccionada)}>Descargar PDF</button>
          {cotizacionEditando ? (
            <>
              <button type="button" className="secondary" onClick={cancelCotizacionEdit}>Cancelar edicion</button>
              <button type="button" onClick={saveCotizacionEdit}>Guardar cambios</button>
            </>
          ) : (
            <button type="button" onClick={startCotizacionEdit}>Editar</button>
          )}
        </div>
      </section>
    </div>
  );
}
