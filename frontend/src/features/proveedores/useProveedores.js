import { useState } from "react";
import { request } from "../../api/client.js";
import { emptyProveedor } from "../../constants/forms.js";
import { cleanText } from "../../utils/format.js";

function proveedorPayload(form) {
  return {
    nombre: form.nombre,
    email_contacto: cleanText(form.email_contacto),
    telefono: cleanText(form.telefono),
    tipo_fuente: form.tipo_fuente,
    activo: Boolean(form.activo),
  };
}

export function useProveedores({ apiUrl, run, setError, loadBaseData, filters = {} }) {
  const [proveedorForm, setProveedorForm] = useState(emptyProveedor);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [proveedorModalOpen, setProveedorModalOpen] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [proveedorEdit, setProveedorEdit] = useState(null);
  const [proveedorEditando, setProveedorEditando] = useState(false);

  async function saveProveedor(event) {
    event.preventDefault();
    await run("Proveedor guardado", async () => {
      const id = editingProveedor;
      await request(apiUrl, id ? `/proveedores/${id}` : "/proveedores", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(proveedorPayload(proveedorForm)),
      });
      setProveedorForm(emptyProveedor);
      setEditingProveedor(null);
      setProveedorModalOpen(false);
      await loadBaseData(filters);
    });
  }

  function openNuevoProveedorModal() {
    setProveedorForm(emptyProveedor);
    setEditingProveedor(null);
    setProveedorModalOpen(true);
  }

  function closeNuevoProveedorModal() {
    setProveedorForm(emptyProveedor);
    setEditingProveedor(null);
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
      await loadBaseData(filters);
    });
  }

  async function softDelete(kind, id) {
    if (kind !== "proveedor") return;
    await run("Proveedor desactivado", async () => {
      await request(apiUrl, `/proveedores/${id}`, { method: "DELETE" });
      await loadBaseData(filters);
    });
  }

  // Adapter: expose editing shape compatible with ProveedoresTab / CategoriasTab
  // ProveedoresTab receives `editing` as { proveedor: id } and `setEditing` as updater
  const editing = { proveedor: editingProveedor };
  function setEditing(updater) {
    const next = typeof updater === "function" ? updater(editing) : updater;
    setEditingProveedor(next.proveedor ?? null);
  }

  return {
    proveedorForm,
    setProveedorForm,
    editing,
    setEditing,
    editingProveedor,
    setEditingProveedor,
    proveedorModalOpen,
    proveedorSeleccionado,
    proveedorEdit,
    setProveedorEdit,
    proveedorEditando,
    setProveedorEditando,
    saveProveedor,
    openNuevoProveedorModal,
    closeNuevoProveedorModal,
    openProveedorModal,
    closeProveedorModal,
    cancelProveedorEdit,
    saveProveedorEdit,
    softDelete,
  };
}
