import React from "react";
import { Checkbox, Field, Select, TextInput } from "../../components/ui.jsx";
import { formatMoney } from "../../utils/format.js";

export function ProductoModal({
  productoSeleccionado,
  productoEdit,
  setProductoEdit,
  productoEditando,
  setProductoEditando,
  closeProductoModal,
  cancelProductoEdit,
  saveProductoEdit,
  proveedores,
  categorias,
  subcategoriasProductoEdit,
}) {
  if (!productoSeleccionado || !productoEdit) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <section className="modal quoteModal">
        <div className="modalHead">
          <div>
            <h2>{productoEditando ? "Editar producto" : productoSeleccionado.nombre_producto_proveedor}</h2>
            <p>{productoSeleccionado.sku_producto_proveedor} - Producto #{productoSeleccionado.id}</p>
          </div>
          <button type="button" className="secondary" onClick={closeProductoModal}>Cerrar</button>
        </div>

        {productoEditando ? (
          <>
            <div className="modalFormGrid">
              <Field label="Proveedor"><Select value={productoEdit.id_proveedor} onChange={(id_proveedor) => setProductoEdit({ ...productoEdit, id_proveedor })}><option value="">Seleccionar</option>{proveedores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
              <Field label="Categoria"><Select value={productoEdit.id_categoria || ""} onChange={(id_categoria) => setProductoEdit({ ...productoEdit, id_categoria, id_subcategoria: "" })}><option value="">Sin categoria</option>{categorias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
              <Field label="Subcategoria"><Select value={productoEdit.id_subcategoria || ""} onChange={(id_subcategoria) => setProductoEdit({ ...productoEdit, id_subcategoria })}><option value="">Sin subcategoria</option>{subcategoriasProductoEdit.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
              <Field label="SKU proveedor"><TextInput value={productoEdit.sku_producto_proveedor} onChange={(sku_producto_proveedor) => setProductoEdit({ ...productoEdit, sku_producto_proveedor })} /></Field>
              <Field label="Nombre proveedor"><TextInput value={productoEdit.nombre_producto_proveedor} onChange={(nombre_producto_proveedor) => setProductoEdit({ ...productoEdit, nombre_producto_proveedor })} /></Field>
              <Field label="Marca"><TextInput value={productoEdit.marca_producto_proveedor} onChange={(marca_producto_proveedor) => setProductoEdit({ ...productoEdit, marca_producto_proveedor })} /></Field>
              <Field label="Modelo"><TextInput value={productoEdit.modelo_producto_proveedor} onChange={(modelo_producto_proveedor) => setProductoEdit({ ...productoEdit, modelo_producto_proveedor })} /></Field>
              <Field label="Unidad"><TextInput value={productoEdit.unidad} onChange={(unidad) => setProductoEdit({ ...productoEdit, unidad })} /></Field>
              <Field label="Unidad calculo"><TextInput value={productoEdit.unidad_calculo} onChange={(unidad_calculo) => setProductoEdit({ ...productoEdit, unidad_calculo })} /></Field>
              <Field label="Cantidad por unidad compra"><TextInput type="number" value={productoEdit.cantidad_por_unidad_compra} onChange={(cantidad_por_unidad_compra) => setProductoEdit({ ...productoEdit, cantidad_por_unidad_compra })} /></Field>
              <Field label="Redondeo compra"><Select value={productoEdit.redondeo_compra || ""} onChange={(redondeo_compra) => setProductoEdit({ ...productoEdit, redondeo_compra })}><option value="">Sin redondeo</option><option value="ARRIBA">Arriba</option></Select></Field>
              <Field label="Precio actual"><TextInput type="number" value={productoEdit.precio_actual} onChange={(precio_actual) => setProductoEdit({ ...productoEdit, precio_actual })} /></Field>
              <Field label="Moneda"><Select value={productoEdit.moneda_actual || ""} onChange={(moneda_actual) => setProductoEdit({ ...productoEdit, moneda_actual })}><option value="">Sin moneda</option><option>ARS</option><option>USD</option></Select></Field>
              <Field label="Fecha precio"><TextInput type="datetime-local" value={productoEdit.fecha_precio_actualizada || ""} onChange={(fecha_precio_actualizada) => setProductoEdit({ ...productoEdit, fecha_precio_actualizada })} /></Field>
              <Checkbox label="Activo" checked={productoEdit.activo} onChange={(activo) => setProductoEdit({ ...productoEdit, activo })} />
            </div>
            <Field label="Descripcion"><textarea value={productoEdit.descripcion || ""} onChange={(event) => setProductoEdit({ ...productoEdit, descripcion: event.target.value })} /></Field>
            <Field label="Imagen URL"><TextInput value={productoEdit.imagen_url} onChange={(imagen_url) => setProductoEdit({ ...productoEdit, imagen_url })} /></Field>
          </>
        ) : (
          <>
            <div className="quoteMeta">
              <div><strong>Proveedor</strong><span>{productoSeleccionado.proveedor?.nombre || proveedores.find((item) => item.id === productoSeleccionado.id_proveedor)?.nombre || productoSeleccionado.id_proveedor}</span></div>
              <div><strong>SKU</strong><span>{productoSeleccionado.sku_producto_proveedor}</span></div>
              <div><strong>Categoria</strong><span>{productoSeleccionado.categoria?.nombre || categorias.find((item) => item.id === productoSeleccionado.id_categoria)?.nombre || "-"}</span></div>
              <div><strong>Precio</strong><span>{formatMoney(productoSeleccionado.precio_actual, productoSeleccionado.moneda_actual)}</span></div>
              <div><strong>Marca</strong><span>{productoSeleccionado.marca_producto_proveedor || "-"}</span></div>
              <div><strong>Modelo</strong><span>{productoSeleccionado.modelo_producto_proveedor || "-"}</span></div>
              <div><strong>Unidad</strong><span>{productoSeleccionado.unidad || "-"}</span></div>
              <div><strong>Unidad calculo</strong><span>{productoSeleccionado.unidad_calculo || "-"}</span></div>
              <div><strong>Equivalencia</strong><span>{productoSeleccionado.cantidad_por_unidad_compra ? `1 ${productoSeleccionado.unidad || "unidad"} = ${Number(productoSeleccionado.cantidad_por_unidad_compra).toLocaleString("es-AR")} ${productoSeleccionado.unidad_calculo || ""}` : "-"}</span></div>
              <div><strong>Redondeo</strong><span>{productoSeleccionado.redondeo_compra || "-"}</span></div>
              <div><strong>Activo</strong><span>{productoSeleccionado.activo ? "Si" : "No"}</span></div>
            </div>
            {productoSeleccionado.descripcion && (
              <div className="quoteNotes">
                <strong>Descripcion</strong>
                <p>{productoSeleccionado.descripcion}</p>
              </div>
            )}
            {productoSeleccionado.imagen_url && (
              <div className="quoteNotes">
                <strong>Imagen URL</strong>
                <p>{productoSeleccionado.imagen_url}</p>
              </div>
            )}
          </>
        )}

        <div className="modalFooter">
          <button type="button" className="secondary" onClick={closeProductoModal}>Cerrar</button>
          {productoEditando ? (
            <>
              <button type="button" className="secondary" onClick={cancelProductoEdit}>Cancelar edicion</button>
              <button type="button" onClick={saveProductoEdit}>Guardar cambios</button>
            </>
          ) : (
            <button type="button" onClick={() => setProductoEditando(true)}>Editar</button>
          )}
        </div>
      </section>
    </div>
  );
}
