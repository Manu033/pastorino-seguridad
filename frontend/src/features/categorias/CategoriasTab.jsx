import React, { useState } from "react";
import { Actions, Field, Select, TextInput } from "../../components/ui.jsx";
import { emptyCategoria, emptySubcategoria } from "../../constants/forms.js";

export function CategoriasTab({
  categoriaForm,
  setCategoriaForm,
  subcategoriaForm,
  setSubcategoriaForm,
  editing,
  setEditing,
  saveCategoria,
  saveSubcategoria,
  categorias,
  subcategorias,
}) {
  const [showCatForm, setShowCatForm] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);

  function handleNewCategoria() {
    setCategoriaForm(emptyCategoria);
    setEditing({ ...editing, categoria: null });
    setShowCatForm(true);
    setShowSubForm(false);
  }

  function handleEditCategoria(cat) {
    setCategoriaForm(cat);
    setEditing({ ...editing, categoria: cat.id });
    setShowCatForm(true);
    setShowSubForm(false);
  }

  function handleNewSubcategoria(idCategoria) {
    setSubcategoriaForm({ ...emptySubcategoria, id_categoria: idCategoria ?? "" });
    setEditing({ ...editing, subcategoria: null });
    setShowSubForm(true);
    setShowCatForm(false);
  }

  function handleEditSubcategoria(sub) {
    setSubcategoriaForm(sub);
    setEditing({ ...editing, subcategoria: sub.id });
    setShowSubForm(true);
    setShowCatForm(false);
  }

  async function handleSaveCategoria(e) {
    await saveCategoria(e);
    setShowCatForm(false);
  }

  async function handleSaveSubcategoria(e) {
    await saveSubcategoria(e);
    setShowSubForm(false);
  }

  return (
    <section className="panel wide fullWidthPanel">
      <div className="panelHead">
        <h2>Categorias y subcategorias</h2>
        <button type="button" onClick={handleNewCategoria}>+ Nueva categoria</button>
      </div>

      {showCatForm && (
        <form className="inlineForm" onSubmit={handleSaveCategoria}>
          <h3>{editing.categoria ? "Editar categoria" : "Nueva categoria"}</h3>
          <Field label="Nombre">
            <TextInput
              value={categoriaForm.nombre}
              onChange={(nombre) => setCategoriaForm({ nombre })}
            />
          </Field>
          <Actions>
            <button type="submit">{editing.categoria ? "Guardar cambios" : "Crear categoria"}</button>
            <button type="button" className="secondary" onClick={() => setShowCatForm(false)}>
              Cancelar
            </button>
          </Actions>
        </form>
      )}

      {showSubForm && (
        <form className="inlineForm" onSubmit={handleSaveSubcategoria}>
          <h3>{editing.subcategoria ? "Editar subcategoria" : "Nueva subcategoria"}</h3>
          <Field label="Categoria">
            <Select
              value={subcategoriaForm.id_categoria}
              onChange={(id_categoria) => setSubcategoriaForm({ ...subcategoriaForm, id_categoria })}
            >
              <option value="">Seleccionar</option>
              {categorias.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nombre">
            <TextInput
              value={subcategoriaForm.nombre}
              onChange={(nombre) => setSubcategoriaForm({ ...subcategoriaForm, nombre })}
            />
          </Field>
          <Actions>
            <button type="submit">{editing.subcategoria ? "Guardar cambios" : "Crear subcategoria"}</button>
            <button type="button" className="secondary" onClick={() => setShowSubForm(false)}>
              Cancelar
            </button>
          </Actions>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Subcategorias</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat) => {
            const subs = subcategorias.filter((sub) => sub.id_categoria === cat.id);
            return (
              <tr key={cat.id}>
                <td>{cat.nombre}</td>
                <td>
                  {subs.length === 0 ? (
                    <span className="emptyHint">—</span>
                  ) : (
                    <span className="subList">
                      {subs.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          className="subChip"
                          onClick={() => handleEditSubcategoria(sub)}
                        >
                          {sub.nombre}
                        </button>
                      ))}
                    </span>
                  )}
                </td>
                <td className="rowActions">
                  <button type="button" onClick={() => handleNewSubcategoria(cat.id)}>
                    + Subcategoria
                  </button>
                  <button type="button" className="secondary" onClick={() => handleEditCategoria(cat)}>
                    Editar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
