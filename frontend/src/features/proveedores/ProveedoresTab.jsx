import React from "react";
import { Actions, Checkbox, Field, Select, TextInput } from "../../components/ui.jsx";
import { TIPO_LABELS } from "../../constants/forms.js";

const TIPOS = ["EXTINCION", "DETECCION", "SALA_BOMBAS"];

function toggleTipo(tipos, tipo) {
  return tipos.includes(tipo) ? tipos.filter((t) => t !== tipo) : [...tipos, tipo];
}

function ProveedorForm({ proveedorForm, setProveedorForm, saveProveedor, onCancel }) {
  return (
    <form onSubmit={saveProveedor}>
      <div className="modalFormGrid">
        <Field label="Nombre"><TextInput value={proveedorForm.nombre} onChange={(nombre) => setProveedorForm({ ...proveedorForm, nombre })} /></Field>
        <Field label="Email"><TextInput value={proveedorForm.email_contacto} onChange={(email_contacto) => setProveedorForm({ ...proveedorForm, email_contacto })} /></Field>
        <Field label="Telefono"><TextInput value={proveedorForm.telefono} onChange={(telefono) => setProveedorForm({ ...proveedorForm, telefono })} /></Field>
        <Field label="Tipo fuente">
          <Select value={proveedorForm.tipo_fuente} onChange={(tipo_fuente) => setProveedorForm({ ...proveedorForm, tipo_fuente })}>
            <option>MANUAL</option><option>EXCEL</option><option>PDF</option><option>API</option>
          </Select>
        </Field>
        <Field label="Tipos">
          <div className="checkGroup">
            {TIPOS.map((t) => (
              <Checkbox
                key={t}
                label={TIPO_LABELS[t]}
                checked={(proveedorForm.tipos || []).includes(t)}
                onChange={() => setProveedorForm({ ...proveedorForm, tipos: toggleTipo(proveedorForm.tipos || [], t) })}
              />
            ))}
          </div>
        </Field>
        <Checkbox label="Activo" checked={proveedorForm.activo} onChange={(activo) => setProveedorForm({ ...proveedorForm, activo })} />
      </div>
      <Actions>
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit">Guardar proveedor</button>
      </Actions>
    </form>
  );
}

function NuevoProveedorModal({ open, closeNuevoProveedorModal, proveedorForm, setProveedorForm, saveProveedor }) {
  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <section className="modal">
        <div className="modalHead">
          <div>
            <h2>Nuevo proveedor</h2>
            <p>Carga de proveedor</p>
          </div>
          <button type="button" className="secondary" onClick={closeNuevoProveedorModal}>Cerrar</button>
        </div>
        <ProveedorForm
          proveedorForm={proveedorForm}
          setProveedorForm={setProveedorForm}
          saveProveedor={saveProveedor}
          onCancel={closeNuevoProveedorModal}
        />
      </section>
    </div>
  );
}

export function ProveedoresTab({
  proveedorForm,
  setProveedorForm,
  saveProveedor,
  proveedorModalOpen,
  openNuevoProveedorModal,
  closeNuevoProveedorModal,
  loadBaseData,
  filters,
  setFilters,
  proveedores,
  openProveedorModal,
  softDelete,
}) {
  return (
    <section className="productLayout">
      <section className="panel wide">
        <div className="panelHead">
          <h2>Proveedores</h2>
          <div className="rowActions">
            <Checkbox label="Incluir inactivos" checked={filters.incluirInactivos} onChange={(incluirInactivos) => { const next = { ...filters, incluirInactivos }; setFilters(next); loadBaseData(next); }} />
            <button type="button" className="secondary" onClick={() => loadBaseData(filters)}>Actualizar</button>
            <button type="button" onClick={openNuevoProveedorModal}>Nuevo proveedor</button>
          </div>
        </div>
        <table><thead><tr><th>ID</th><th>Nombre</th><th>Fuente</th><th>Tipo</th><th>Contacto</th><th>Activo</th><th></th></tr></thead><tbody>
          {proveedores.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td><td>{item.nombre}</td><td>{item.tipo_fuente}</td><td>{(item.tipos || []).map((t) => TIPO_LABELS[t] ?? t).join(", ")}</td><td>{item.email_contacto || item.telefono || "-"}</td><td>{item.activo ? "Si" : "No"}</td>
              <td className="rowActions">
                <button type="button" onClick={() => openProveedorModal(item)}>Ver</button>
                <button type="button" className="danger" onClick={() => softDelete("proveedor", item.id)}>Desactivar</button>
              </td>
            </tr>
          ))}
        </tbody></table>
      </section>
      <NuevoProveedorModal
        open={proveedorModalOpen}
        closeNuevoProveedorModal={closeNuevoProveedorModal}
        proveedorForm={proveedorForm}
        setProveedorForm={setProveedorForm}
        saveProveedor={saveProveedor}
      />
    </section>
  );
}
