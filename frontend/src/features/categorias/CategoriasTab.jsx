import React from "react";
import { Actions, Field, Select, TextInput } from "../../components/ui.jsx";

export function CategoriasTab({
  categoriaForm,
  setCategoriaForm,
  subcategoriaForm,
  setSubcategoriaForm,
  editing,
  setEditing,
  saveCategoria,
  saveSubcategoria,
  loadBaseData,
  categorias,
  subcategorias,
}) {
  return (
    <>
      <section className="legacyGrid formGrid">
        <form className="panel" onSubmit={saveCategoria}>
          <h2>{editing.categoria ? "Editar categoria" : "Nueva categoria"}</h2>
          <Field label="Nombre"><TextInput value={categoriaForm.nombre} onChange={(nombre) => setCategoriaForm({ nombre })} /></Field>
          <Actions><button type="submit">Guardar</button><button type="button" className="secondary" onClick={loadBaseData}>Actualizar</button></Actions>
        </form>
        <form className="panel" onSubmit={saveSubcategoria}>
          <h2>{editing.subcategoria ? "Editar subcategoria" : "Nueva subcategoria"}</h2>
          <Field label="Categoria"><Select value={subcategoriaForm.id_categoria} onChange={(id_categoria) => setSubcategoriaForm({ ...subcategoriaForm, id_categoria })}><option value="">Seleccionar</option>{categorias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
          <Field label="Nombre"><TextInput value={subcategoriaForm.nombre} onChange={(nombre) => setSubcategoriaForm({ ...subcategoriaForm, nombre })} /></Field>
          <Actions><button type="submit">Guardar</button></Actions>
        </form>
      </section>
      <section className="panel wide fullWidthPanel">
        <h2>Categorias y subcategorias</h2>
        <table><thead><tr><th>ID</th><th>Categoria</th><th>Subcategorias</th><th></th></tr></thead><tbody>
          {categorias.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.id}</td><td>{cat.nombre}</td>
              <td>{subcategorias.filter((sub) => sub.id_categoria === cat.id).map((sub) => sub.nombre).join(", ") || "-"}</td>
              <td className="rowActions"><button type="button" onClick={() => { setCategoriaForm(cat); setEditing({ ...editing, categoria: cat.id }); }}>Editar</button></td>
            </tr>
          ))}
        </tbody></table>
        <h3>Subcategorias</h3>
        <table><thead><tr><th>ID</th><th>Categoria</th><th>Nombre</th><th></th></tr></thead><tbody>
          {subcategorias.map((sub) => (
            <tr key={sub.id}><td>{sub.id}</td><td>{categorias.find((cat) => cat.id === sub.id_categoria)?.nombre || sub.id_categoria}</td><td>{sub.nombre}</td><td className="rowActions"><button type="button" onClick={() => { setSubcategoriaForm(sub); setEditing({ ...editing, subcategoria: sub.id }); }}>Editar</button></td></tr>
          ))}
        </tbody></table>
      </section>
    </>
  );
}
