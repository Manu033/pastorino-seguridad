import React from "react";
import { Checkbox, Field, Select } from "../../components/ui.jsx";

export function ClasificacionTab({
  productos,
  loading,
  filters,
  setFilters,
  cargarProductos,
  seleccionados,
  toggleSeleccion,
  toggleTodos,
  categoriaAsignar,
  setCategoriaAsignar,
  subcategoriaAsignar,
  setSubcategoriaAsignar,
  subcategoriasDisponibles,
  aplicarCategoria,
  limpiarCategoria,
  proveedores,
  categorias,
  productoEditar,
  abrirModalEditar,
  cerrarModalEditar,
  categoriaEditar,
  setCategoriaEditar,
  subcategoriaEditar,
  setSubcategoriaEditar,
  subcategoriasEditar,
  guardarEdicion,
}) {
  const todosSeleccionados = productos.length > 0 && seleccionados.size === productos.length;
  const haySeleccion = seleccionados.size > 0;

  return (
    <section className="panel productLayout">
      <div className="filters">
        <Field label="Proveedor">
          <Select
            value={filters.idProveedor}
            onChange={(v) => setFilters((f) => ({ ...f, idProveedor: v }))}
          >
            <option value="">Todos</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Checkbox
          checked={filters.soloSinCategoria}
          onChange={(v) => setFilters((f) => ({ ...f, soloSinCategoria: v }))}
          label="Solo sin categoría"
        />
        <button type="button" onClick={cargarProductos} disabled={loading}>
          {loading ? "Cargando..." : "Buscar"}
        </button>
      </div>

      {productos.length > 0 && (
        <div className="filters">
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#405060" }}>
            {seleccionados.size} de {productos.length} seleccionados
          </span>
          <Field label="Categoría">
            <Select value={categoriaAsignar} onChange={setCategoriaAsignar}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subcategoría">
            <Select
              value={subcategoriaAsignar}
              onChange={setSubcategoriaAsignar}
            >
              <option value="">Sin subcategoría</option>
              {subcategoriasDisponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <button type="button" onClick={aplicarCategoria} disabled={!haySeleccion}>
            Aplicar a seleccionados
          </button>
          <button type="button" className="secondary" onClick={limpiarCategoria} disabled={!haySeleccion}>
            Limpiar categoría
          </button>
        </div>
      )}

      {productos.length === 0 ? (
        <p className="hint">Aplicá los filtros y hacé clic en Buscar</p>
      ) : (
        <div className="wide">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={toggleTodos}
                    style={{ minHeight: "auto", width: "auto" }}
                  />
                </th>
                <th>Proveedor</th>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Subcategoría</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => abrirModalEditar(p)}
                  style={{ cursor: "pointer" }}
                  title="Clic para editar categoría"
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={seleccionados.has(p.id)}
                      onChange={() => toggleSeleccion(p.id)}
                      style={{ minHeight: "auto", width: "auto" }}
                    />
                  </td>
                  <td>{p.proveedor?.nombre ?? "—"}</td>
                  <td>{p.sku_producto_proveedor}</td>
                  <td>{p.nombre_producto_proveedor}</td>
                  <td>{p.categoria?.nombre ?? <span style={{ color: "#94a3b8" }}>—</span>}</td>
                  <td>{p.subcategoria?.nombre ?? <span style={{ color: "#94a3b8" }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {productoEditar && (
        <div
          className="modalOverlay"
          onClick={cerrarModalEditar}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "380px" }}
          >
            <h2>Editar categoría</h2>
            <p style={{ color: "#64748b", marginBottom: "1rem", fontSize: "0.9rem" }}>
              <strong>{productoEditar.nombre_producto_proveedor}</strong>
              <br />
              {productoEditar.proveedor?.nombre} · {productoEditar.sku_producto_proveedor}
            </p>

            <Field label="Categoría">
              <Select value={categoriaEditar} onChange={setCategoriaEditar}>
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Subcategoría">
              <Select
                value={subcategoriaEditar}
                onChange={setSubcategoriaEditar}
                disabled={!categoriaEditar}
              >
                <option value="">Sin subcategoría</option>
                {subcategoriasEditar.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="modalFooter">
              <button type="button" onClick={guardarEdicion}>
                Guardar
              </button>
              <button type="button" className="secondary" onClick={cerrarModalEditar}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
