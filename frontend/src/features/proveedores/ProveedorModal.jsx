import React from "react";
import { Checkbox, Field, Select, TextInput } from "../../components/ui.jsx";

export function ProveedorModal({
  proveedorSeleccionado,
  proveedorEdit,
  setProveedorEdit,
  proveedorEditando,
  setProveedorEditando,
  closeProveedorModal,
  cancelProveedorEdit,
  saveProveedorEdit,
}) {
  if (!proveedorSeleccionado || !proveedorEdit) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <section className="modal">
        <div className="modalHead">
          <div>
            <h2>{proveedorEditando ? "Editar proveedor" : proveedorSeleccionado.nombre}</h2>
            <p>Proveedor #{proveedorSeleccionado.id}</p>
          </div>
          <button type="button" className="secondary" onClick={closeProveedorModal}>Cerrar</button>
        </div>

        {proveedorEditando ? (
          <div className="modalFormGrid">
            <Field label="Nombre"><TextInput value={proveedorEdit.nombre} onChange={(nombre) => setProveedorEdit({ ...proveedorEdit, nombre })} /></Field>
            <Field label="Email"><TextInput value={proveedorEdit.email_contacto} onChange={(email_contacto) => setProveedorEdit({ ...proveedorEdit, email_contacto })} /></Field>
            <Field label="Telefono"><TextInput value={proveedorEdit.telefono} onChange={(telefono) => setProveedorEdit({ ...proveedorEdit, telefono })} /></Field>
            <Field label="Tipo fuente">
              <Select value={proveedorEdit.tipo_fuente} onChange={(tipo_fuente) => setProveedorEdit({ ...proveedorEdit, tipo_fuente })}>
                <option>MANUAL</option><option>EXCEL</option><option>PDF</option><option>API</option>
              </Select>
            </Field>
            <Checkbox label="Activo" checked={proveedorEdit.activo} onChange={(activo) => setProveedorEdit({ ...proveedorEdit, activo })} />
          </div>
        ) : (
          <div className="quoteMeta">
            <div><strong>Nombre</strong><span>{proveedorSeleccionado.nombre}</span></div>
            <div><strong>Fuente</strong><span>{proveedorSeleccionado.tipo_fuente}</span></div>
            <div><strong>Email</strong><span>{proveedorSeleccionado.email_contacto || "-"}</span></div>
            <div><strong>Telefono</strong><span>{proveedorSeleccionado.telefono || "-"}</span></div>
            <div><strong>Activo</strong><span>{proveedorSeleccionado.activo ? "Si" : "No"}</span></div>
          </div>
        )}

        <div className="modalFooter">
          <button type="button" className="secondary" onClick={closeProveedorModal}>Cerrar</button>
          {proveedorEditando ? (
            <>
              <button type="button" className="secondary" onClick={cancelProveedorEdit}>Cancelar edicion</button>
              <button type="button" onClick={saveProveedorEdit}>Guardar cambios</button>
            </>
          ) : (
            <button type="button" onClick={() => setProveedorEditando(true)}>Editar</button>
          )}
        </div>
      </section>
    </div>
  );
}
