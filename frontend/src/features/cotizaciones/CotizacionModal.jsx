import React from "react";
import { Checkbox, Field, Select, TextInput } from "../../components/ui.jsx";
import { formatDate, formatMoney } from "../../utils/format.js";
import { buildWhatsAppLinks } from "./whatsapp.js";

const STATUS_STYLES = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  APROBADA: "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
};

const ALL_STATUSES = ["PENDIENTE", "APROBADA", "RECHAZADA"];

const STATUS_ACTION_LABELS = {
  PENDIENTE: "Volver a Pendiente",
  APROBADA: "Aprobar",
  RECHAZADA: "Rechazar",
};

function StatusBadge({ estado }) {
  if (!estado) return null;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[estado] ?? "bg-slate-100 text-slate-600"}`}>
      {estado}
    </span>
  );
}

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
  onUpdateStatus,
  updatingStatus,
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

            {/* Status section — view mode only, not in wizard */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <strong className="text-sm text-slate-600">Estado:</strong>
              <StatusBadge estado={cotizacionSeleccionada.estado} />
              <div className="flex flex-wrap gap-2 ml-auto">
                {ALL_STATUSES.filter((s) => s !== cotizacionSeleccionada.estado).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={updatingStatus}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                      s === "APROBADA"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : s === "RECHAZADA"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-yellow-500 text-white hover:bg-yellow-600"
                    }`}
                    onClick={() => onUpdateStatus && onUpdateStatus(cotizacionSeleccionada.id, s)}
                  >
                    {STATUS_ACTION_LABELS[s] ?? s}
                  </button>
                ))}
              </div>
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

            {/* Purchase section — only when APROBADA */}
            {cotizacionSeleccionada.estado === "APROBADA" && (() => {
              const links = buildWhatsAppLinks(cotizacionSeleccionada.items || []);
              const manualItems = (cotizacionSeleccionada.items || []).filter(
                (item) => item.tipo === "MANUAL",
              );
              if (!links.length && !manualItems.length) return null;
              return (
                <div className="grid gap-3">
                  {links.length > 0 && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4">
                      <strong className="mb-3 block text-sm text-green-800">Contacto proveedores</strong>
                      <div className="grid gap-2">
                        {links.map((group) => (
                          <div key={group.proveedorId} className="rounded-lg border border-green-200 bg-white px-3 py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {group.hasPhone ? (
                                <a
                                  href={group.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-green-700 hover:underline"
                                >
                                  {group.proveedorNombre}
                                </a>
                              ) : (
                                <span className="font-bold text-slate-600">
                                  {group.proveedorNombre} <span className="text-xs font-normal text-slate-400">(sin telefono)</span>
                                </span>
                              )}
                            </div>
                            <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
                              {group.productos.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {manualItems.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                      <strong className="mb-3 block text-sm text-amber-800">Items manuales a tener en cuenta</strong>
                      <ul className="grid gap-1">
                        {manualItems.map((item) => {
                          const cantidadDisplay =
                            Number(item.cantidad) % 1 === 0
                              ? String(Number(item.cantidad))
                              : Number(item.cantidad).toLocaleString("es-AR");
                          return (
                            <li key={item.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700">
                              {item.descripcion} <span className="font-bold">x{cantidadDisplay}</span>
                              {item.unidad ? <span className="ml-1 text-xs text-slate-400">{item.unidad}</span> : null}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
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
            <button type="button" onClick={() => startCotizacionEdit()}>Editar</button>
          )}
        </div>
      </section>
    </div>
  );
}
