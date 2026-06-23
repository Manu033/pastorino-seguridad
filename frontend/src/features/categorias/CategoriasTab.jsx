import React, { useState } from "react";
import { Checkbox, Field, Select, TextInput } from "../../components/ui.jsx";
import { emptyCategoria, emptySubcategoria, TIPO_LABELS } from "../../constants/forms.js";

const TIPOS = ["EXTINCION", "DETECCION", "SALA_BOMBAS"];

function toggleTipo(tipos, tipo) {
  return tipos.includes(tipo) ? tipos.filter((t) => t !== tipo) : [...tipos, tipo];
}

function CategoriaModal({ open, editing, form, setForm, onSave, onClose }) {
  if (!open) return null;
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <section className="modal">
        <div className="modalHead">
          <h2>{editing ? "Editar categoria" : "Nueva categoria"}</h2>
          <button type="button" className="secondary" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSave}>
          <div className="modalFormGrid">
            <Field label="Nombre">
              <TextInput autoFocus
                value={form.nombre}
                onChange={(nombre) => setForm({ ...form, nombre })}
              />
            </Field>
            <Field label="Tipos de cotizacion">
              <div className="checkGroup">
                {TIPOS.map((t) => (
                  <Checkbox
                    key={t}
                    label={TIPO_LABELS[t]}
                    checked={(form.tipos || []).includes(t)}
                    onChange={() => setForm({ ...form, tipos: toggleTipo(form.tipos || [], t) })}
                  />
                ))}
              </div>
            </Field>
          </div>
          <div className="modalFooter">
            <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
            <button type="submit">{editing ? "Guardar cambios" : "Crear categoria"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SubcategoriaModal({ open, editing, form, setForm, categorias, onSave, onClose }) {
  if (!open) return null;
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <section className="modal">
        <div className="modalHead">
          <h2>{editing ? "Editar subcategoria" : "Nueva subcategoria"}</h2>
          <button type="button" className="secondary" onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={onSave}>
          <div className="modalFormGrid">
            <Field label="Categoria">
              <Select
                value={form.id_categoria}
                onChange={(id_categoria) => setForm({ ...form, id_categoria })}
              >
                <option value="">Seleccionar</option>
                {categorias.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre">
              <TextInput autoFocus
                value={form.nombre}
                onChange={(nombre) => setForm({ ...form, nombre })}
              />
            </Field>
          </div>
          <div className="modalFooter">
            <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
            <button type="submit">{editing ? "Guardar cambios" : "Crear subcategoria"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

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
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);

  function handleNewCategoria() {
    setCategoriaForm(emptyCategoria);
    setEditing({ ...editing, categoria: null });
    setCatModalOpen(true);
  }

  function handleEditCategoria(cat) {
    setCategoriaForm(cat);
    setEditing({ ...editing, categoria: cat.id });
    setCatModalOpen(true);
  }

  function handleNewSubcategoria(idCategoria) {
    setSubcategoriaForm({ ...emptySubcategoria, id_categoria: idCategoria ?? "" });
    setEditing({ ...editing, subcategoria: null });
    setSubModalOpen(true);
  }

  function handleEditSubcategoria(sub) {
    setSubcategoriaForm(sub);
    setEditing({ ...editing, subcategoria: sub.id });
    setSubModalOpen(true);
  }

  async function handleSaveCategoria(e) {
    await saveCategoria(e);
    setCatModalOpen(false);
  }

  async function handleSaveSubcategoria(e) {
    await saveSubcategoria(e);
    setSubModalOpen(false);
  }

  return (
    <section className="panel wide fullWidthPanel">
      <div className="panelHead">
        <h2>Categorias y subcategorias</h2>
        <button type="button" onClick={handleNewCategoria}>+ Nueva categoria</button>
      </div>

      <CategoriaModal
        open={catModalOpen}
        editing={editing.categoria}
        form={categoriaForm}
        setForm={setCategoriaForm}
        onSave={handleSaveCategoria}
        onClose={() => setCatModalOpen(false)}
      />

      <SubcategoriaModal
        open={subModalOpen}
        editing={editing.subcategoria}
        form={subcategoriaForm}
        setForm={setSubcategoriaForm}
        categorias={categorias}
        onSave={handleSaveSubcategoria}
        onClose={() => setSubModalOpen(false)}
      />

      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Tipos</th>
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
                  {(cat.tipos || []).length === 0 ? (
                    <span className="emptyHint">Todos</span>
                  ) : (
                    <span className="subList">
                      {(cat.tipos || []).map((t) => (
                        <span key={t} className="subChip">{TIPO_LABELS[t]}</span>
                      ))}
                    </span>
                  )}
                </td>
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
