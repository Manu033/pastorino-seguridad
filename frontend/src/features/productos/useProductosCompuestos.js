import { useMemo, useState } from "react";
import { request } from "../../api/client.js";
import { emptyCompuestoForm, emptyCompuestoItemForm } from "../../constants/forms.js";

export function useProductosCompuestos({ apiUrl, run, setError, subcategorias, loadProductosBusqueda }) {
  const [compuestos, setCompuestos] = useState([]);
  const [compuestoForm, setCompuestoForm] = useState(emptyCompuestoForm);
  const [compuestoItems, setCompuestoItems] = useState([]);
  const [compuestoItemForm, setCompuestoItemForm] = useState(emptyCompuestoItemForm);
  const [editingCompuesto, setEditingCompuesto] = useState(null);
  const [compuestoModalOpen, setCompuestoModalOpen] = useState(false);

  const subcategoriasCompuesto = useMemo(
    () => subcategorias.filter((item) => String(item.id_categoria) === String(compuestoForm.id_categoria)),
    [subcategorias, compuestoForm.id_categoria],
  );

  async function loadCompuestos() {
    const data = await request(apiUrl, "/productos-compuestos");
    setCompuestos(Array.isArray(data) ? data : []);
  }

  function addItemToCompuesto() {
    const { tipo, idProducto, buscar: _b, descripcion, cantidad, unidad, precio_unitario, moneda } = compuestoItemForm;
    const cantNum = Number(cantidad);
    if (cantNum <= 0) { setError("La cantidad del item debe ser mayor a cero"); return; }

    if (tipo === "PRODUCTO") {
      if (!idProducto) { setError("Selecciona un producto"); return; }
      setCompuestoItems((items) => [
        ...items,
        { localId: crypto.randomUUID(), tipo: "PRODUCTO", id_producto_proveedor: Number(idProducto), descripcion, cantidad: cantNum, unidad: unidad || null, precio_unitario: null, moneda: null },
      ]);
    } else {
      if (!descripcion.trim()) { setError("La descripcion del item manual es requerida"); return; }
      const precioNum = Number(precio_unitario);
      if (precioNum < 0) { setError("El precio no puede ser negativo"); return; }
      setCompuestoItems((items) => [
        ...items,
        { localId: crypto.randomUUID(), tipo: "MANUAL", id_producto_proveedor: null, descripcion: descripcion.trim(), cantidad: cantNum, unidad: unidad || null, precio_unitario: precioNum, moneda },
      ]);
    }
    setCompuestoItemForm(emptyCompuestoItemForm);
    setError("");
  }

  function removeItemFromCompuesto(localId) {
    setCompuestoItems((items) => items.filter((i) => i.localId !== localId));
  }

  async function saveCompuesto(event) {
    event.preventDefault();
    if (!compuestoForm.nombre.trim()) { setError("El nombre del compuesto es requerido"); return; }
    if (!compuestoItems.length) { setError("Agrega al menos un item al compuesto"); return; }

    await run("Compuesto guardado", async () => {
      const id = editingCompuesto;
      const payload = {
        id_categoria: compuestoForm.id_categoria ? Number(compuestoForm.id_categoria) : null,
        id_subcategoria: compuestoForm.id_subcategoria ? Number(compuestoForm.id_subcategoria) : null,
        nombre: compuestoForm.nombre.trim(),
        descripcion: compuestoForm.descripcion.trim() || null,
        items: compuestoItems.map(({ localId: _l, ...item }) => ({
          tipo: item.tipo,
          id_producto_proveedor: item.id_producto_proveedor ?? null,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          unidad: item.unidad ?? null,
          precio_unitario: item.precio_unitario ?? null,
          moneda: item.moneda ?? null,
        })),
      };
      await request(apiUrl, id ? `/productos-compuestos/${id}` : "/productos-compuestos", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setCompuestoForm(emptyCompuestoForm);
      setCompuestoItems([]);
      setEditingCompuesto(null);
      setCompuestoModalOpen(false);
      await loadCompuestos();
      await loadProductosBusqueda();
    });
  }

  function openNuevoCompuestoModal() {
    setCompuestoForm(emptyCompuestoForm);
    setCompuestoItems([]);
    setCompuestoItemForm(emptyCompuestoItemForm);
    setEditingCompuesto(null);
    setCompuestoModalOpen(true);
  }

  function openEditCompuestoModal(compuesto) {
    setCompuestoForm({
      id_categoria: compuesto.id_categoria || "",
      id_subcategoria: compuesto.id_subcategoria || "",
      nombre: compuesto.nombre,
      descripcion: compuesto.descripcion || "",
    });
    setCompuestoItems(
      (compuesto.items || []).map((item) => ({
        ...item,
        localId: crypto.randomUUID(),
        id_producto_proveedor: item.id_producto_proveedor ?? null,
        precio_unitario: item.precio_unitario !== null ? Number(item.precio_unitario) : null,
        cantidad: Number(item.cantidad),
      })),
    );
    setCompuestoItemForm(emptyCompuestoItemForm);
    setEditingCompuesto(compuesto.id);
    setCompuestoModalOpen(true);
  }

  function closeCompuestoModal() {
    setCompuestoModalOpen(false);
    setCompuestoForm(emptyCompuestoForm);
    setCompuestoItems([]);
    setCompuestoItemForm(emptyCompuestoItemForm);
    setEditingCompuesto(null);
  }

  return {
    compuestos,
    compuestoForm,
    setCompuestoForm,
    subcategoriasCompuesto,
    compuestoItems,
    compuestoItemForm,
    setCompuestoItemForm,
    editingCompuesto,
    compuestoModalOpen,
    loadCompuestos,
    saveCompuesto,
    addItemToCompuesto,
    removeItemFromCompuesto,
    openNuevoCompuestoModal,
    openEditCompuestoModal,
    closeCompuestoModal,
  };
}
