import { useState } from "react";
import { request } from "../../api/client.js";
import { emptyCategoria, emptySubcategoria } from "../../constants/forms.js";

export function useCategorias({ apiUrl, run, loadBaseData }) {
  const [categoriaForm, setCategoriaForm] = useState(emptyCategoria);
  const [subcategoriaForm, setSubcategoriaForm] = useState(emptySubcategoria);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [editingSubcategoria, setEditingSubcategoria] = useState(null);

  async function saveCategoria(event) {
    event.preventDefault();
    await run("Categoria guardada", async () => {
      const id = editingCategoria;
      await request(apiUrl, id ? `/categorias/${id}` : "/categorias", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ nombre: categoriaForm.nombre, tipos: categoriaForm.tipos }),
      });
      setCategoriaForm(emptyCategoria);
      setEditingCategoria(null);
      await loadBaseData();
    });
  }

  async function saveSubcategoria(event) {
    event.preventDefault();
    await run("Subcategoria guardada", async () => {
      const id = editingSubcategoria;
      await request(apiUrl, id ? `/subcategorias/${id}` : "/subcategorias", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ id_categoria: Number(subcategoriaForm.id_categoria), nombre: subcategoriaForm.nombre }),
      });
      setSubcategoriaForm(emptySubcategoria);
      setEditingSubcategoria(null);
      await loadBaseData();
    });
  }

  // Adapter: expose editing shape compatible with CategoriasTab
  // CategoriasTab receives `editing` as { categoria: id, subcategoria: id } and `setEditing` as updater
  const editing = { categoria: editingCategoria, subcategoria: editingSubcategoria };
  function setEditing(updater) {
    const next = typeof updater === "function" ? updater(editing) : updater;
    if ("categoria" in next) setEditingCategoria(next.categoria ?? null);
    if ("subcategoria" in next) setEditingSubcategoria(next.subcategoria ?? null);
  }

  return {
    categoriaForm,
    setCategoriaForm,
    subcategoriaForm,
    setSubcategoriaForm,
    editing,
    setEditing,
    saveCategoria,
    saveSubcategoria,
  };
}
