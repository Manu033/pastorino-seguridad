import React from "react";
import { Actions, Checkbox, Field, Select, TextInput } from "../../components/ui.jsx";
import { formatMoney } from "../../utils/format.js";

function ProductoProveedorForm({
  productoProveedorForm,
  setProductoProveedorForm,
  saveProductoProveedor,
  proveedores,
  categorias,
  subcategoriasProductoProveedor,
  onCancel,
}) {
  return (
    <form onSubmit={saveProductoProveedor}>
      <div className="modalFormGrid">
        <Field label="Proveedor"><Select value={productoProveedorForm.id_proveedor} onChange={(id_proveedor) => setProductoProveedorForm({ ...productoProveedorForm, id_proveedor })}><option value="">Seleccionar</option>{proveedores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
        <Field label="Categoria"><Select value={productoProveedorForm.id_categoria || ""} onChange={(id_categoria) => setProductoProveedorForm({ ...productoProveedorForm, id_categoria, id_subcategoria: "" })}><option value="">Sin categoria</option>{categorias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
        <Field label="Subcategoria"><Select value={productoProveedorForm.id_subcategoria || ""} onChange={(id_subcategoria) => setProductoProveedorForm({ ...productoProveedorForm, id_subcategoria })}><option value="">Sin subcategoria</option>{subcategoriasProductoProveedor.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
        <Field label="SKU proveedor"><TextInput value={productoProveedorForm.sku_producto_proveedor} onChange={(sku_producto_proveedor) => setProductoProveedorForm({ ...productoProveedorForm, sku_producto_proveedor })} /></Field>
        <Field label="Nombre proveedor"><TextInput value={productoProveedorForm.nombre_producto_proveedor} onChange={(nombre_producto_proveedor) => setProductoProveedorForm({ ...productoProveedorForm, nombre_producto_proveedor })} /></Field>
        <Field label="Marca"><TextInput value={productoProveedorForm.marca_producto_proveedor} onChange={(marca_producto_proveedor) => setProductoProveedorForm({ ...productoProveedorForm, marca_producto_proveedor })} /></Field>
        <Field label="Modelo"><TextInput value={productoProveedorForm.modelo_producto_proveedor} onChange={(modelo_producto_proveedor) => setProductoProveedorForm({ ...productoProveedorForm, modelo_producto_proveedor })} /></Field>
        <Field label="Imagen URL"><TextInput value={productoProveedorForm.imagen_url} onChange={(imagen_url) => setProductoProveedorForm({ ...productoProveedorForm, imagen_url })} /></Field>
        <Field label="Unidad"><TextInput value={productoProveedorForm.unidad} onChange={(unidad) => setProductoProveedorForm({ ...productoProveedorForm, unidad })} /></Field>
        <Field label="Unidad calculo"><TextInput value={productoProveedorForm.unidad_calculo} onChange={(unidad_calculo) => setProductoProveedorForm({ ...productoProveedorForm, unidad_calculo })} /></Field>
        <Field label="Cantidad por unidad compra"><TextInput type="number" value={productoProveedorForm.cantidad_por_unidad_compra} onChange={(cantidad_por_unidad_compra) => setProductoProveedorForm({ ...productoProveedorForm, cantidad_por_unidad_compra })} /></Field>
        <Field label="Redondeo compra"><Select value={productoProveedorForm.redondeo_compra || ""} onChange={(redondeo_compra) => setProductoProveedorForm({ ...productoProveedorForm, redondeo_compra })}><option value="">Sin redondeo</option><option value="ARRIBA">Arriba</option></Select></Field>
        <Field label="Precio actual"><TextInput type="number" value={productoProveedorForm.precio_actual} onChange={(precio_actual) => setProductoProveedorForm({ ...productoProveedorForm, precio_actual })} /></Field>
        <Field label="Moneda"><Select value={productoProveedorForm.moneda_actual || ""} onChange={(moneda_actual) => setProductoProveedorForm({ ...productoProveedorForm, moneda_actual })}><option value="">Sin moneda</option><option>ARS</option><option>USD</option></Select></Field>
        <Field label="Fecha precio"><TextInput type="datetime-local" value={productoProveedorForm.fecha_precio_actualizada || ""} onChange={(fecha_precio_actualizada) => setProductoProveedorForm({ ...productoProveedorForm, fecha_precio_actualizada })} /></Field>
        <Checkbox label="Activo" checked={productoProveedorForm.activo} onChange={(activo) => setProductoProveedorForm({ ...productoProveedorForm, activo })} />
      </div>
      <Field label="Descripcion"><textarea value={productoProveedorForm.descripcion || ""} onChange={(event) => setProductoProveedorForm({ ...productoProveedorForm, descripcion: event.target.value })} /></Field>
      <Actions><button type="button" className="secondary" onClick={onCancel}>Cancelar</button><button type="submit">Guardar producto</button></Actions>
    </form>
  );
}

function NuevoProductoModal({
  open,
  closeNuevoProductoModal,
  productoProveedorForm,
  setProductoProveedorForm,
  saveProductoProveedor,
  proveedores,
  categorias,
  subcategoriasProductoProveedor,
}) {
  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <section className="modal quoteModal">
        <div className="modalHead">
          <div>
            <h2>Nuevo producto</h2>
            <p>Carga de producto de proveedor</p>
          </div>
          <button type="button" className="secondary" onClick={closeNuevoProductoModal}>Cerrar</button>
        </div>
        <ProductoProveedorForm
          productoProveedorForm={productoProveedorForm}
          setProductoProveedorForm={setProductoProveedorForm}
          saveProductoProveedor={saveProductoProveedor}
          proveedores={proveedores}
          categorias={categorias}
          subcategoriasProductoProveedor={subcategoriasProductoProveedor}
          onCancel={closeNuevoProductoModal}
        />
      </section>
    </div>
  );
}

export function ProductosTab({
  productoProveedorForm,
  setProductoProveedorForm,
  saveProductoProveedor,
  productoProveedorModalOpen,
  openNuevoProductoModal,
  closeNuevoProductoModal,
  proveedores,
  categorias,
  subcategorias,
  subcategoriasProductoProveedor,
  filters,
  setFilters,
  searchProductosProveedor,
  productosProveedorMeta,
  goProductosPage,
  productosProveedor,
  openProductoModal,
}) {
  return (
    <section className="productLayout">
      <section className="panel wide">
        <div className="panelHead">
          <h2>Productos</h2>
          <button type="button" onClick={openNuevoProductoModal}>Nuevo producto</button>
        </div>
        <div className="filters">
          <Field label="Buscar"><TextInput value={filters.buscarProductoProveedor} onChange={(buscarProductoProveedor) => setFilters({ ...filters, buscarProductoProveedor })} /></Field>
          <Field label="Proveedor"><Select value={filters.idProveedorProducto} onChange={(idProveedorProducto) => setFilters({ ...filters, idProveedorProducto })}><option value="">Todos</option>{proveedores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
          <Field label="Categoria"><Select value={filters.idCategoriaProducto} onChange={(idCategoriaProducto) => setFilters({ ...filters, idCategoriaProducto, idSubcategoriaProducto: "" })}><option value="">Todas</option>{categorias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
          <Field label="Subcategoria"><Select value={filters.idSubcategoriaProducto} onChange={(idSubcategoriaProducto) => setFilters({ ...filters, idSubcategoriaProducto })}><option value="">Todas</option>{subcategorias.filter((item) => !filters.idCategoriaProducto || String(item.id_categoria) === String(filters.idCategoriaProducto)).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
          <button type="button" onClick={searchProductosProveedor}>Buscar</button>
        </div>
        <div className="pagination">
          <span>{productosProveedorMeta.total} productos · Pagina {productosProveedorMeta.page} de {productosProveedorMeta.totalPages}</span>
          <div>
            <button type="button" className="secondary" disabled={productosProveedorMeta.page <= 1} onClick={() => goProductosPage(productosProveedorMeta.page - 1)}>Anterior</button>
            <button type="button" className="secondary" disabled={productosProveedorMeta.page >= productosProveedorMeta.totalPages} onClick={() => goProductosPage(productosProveedorMeta.page + 1)}>Siguiente</button>
          </div>
        </div>
        <table><thead><tr><th>ID</th><th>Proveedor</th><th>SKU</th><th>Nombre</th><th>Categoria</th><th>Precio</th><th></th></tr></thead><tbody>
          {productosProveedor.map((item) => (
            <tr key={item.id}><td>{item.id}</td><td>{item.proveedor?.nombre || item.id_proveedor}</td><td>{item.sku_producto_proveedor}</td><td>{item.nombre_producto_proveedor}</td><td>{item.categoria?.nombre || "-"}</td><td>{formatMoney(item.precio_actual, item.moneda_actual)}</td><td className="rowActions"><button type="button" onClick={() => openProductoModal(item)}>Ver</button></td></tr>
          ))}
        </tbody></table>
      </section>
      <NuevoProductoModal
        open={productoProveedorModalOpen}
        closeNuevoProductoModal={closeNuevoProductoModal}
        productoProveedorForm={productoProveedorForm}
        setProductoProveedorForm={setProductoProveedorForm}
        saveProductoProveedor={saveProductoProveedor}
        proveedores={proveedores}
        categorias={categorias}
        subcategoriasProductoProveedor={subcategoriasProductoProveedor}
      />
    </section>
  );
}
