Table proveedores {
  id integer [pk]
  nombre varchar
  email_contacto varchar
  telefono varchar
  tipo_fuente varchar 
  activo boolean
}

Table categorias {
  id integer [pk]
  nombre varchar
}

Table subcategorias {
  id integer [pk]
  id_categoria integer
  nombre varchar
}

Table productos {
  id integer [pk]
  sku_interno varchar
  nombre_normalizado varchar
  id_categoria integer
  id_subcategoria integer
  marca varchar
  modelo varchar
  descripcion text
  imagen_url varchar
  activo boolean
}

Table productos_proveedor {
  id integer [pk]
  id_proveedor integer
  id_producto integer
  sku_proveedor varchar
  nombre_proveedor varchar
  marca_proveedor varchar
  modelo_proveedor varchar
  unidad varchar
  moneda varchar
  activo boolean
}

Table historial_precios {
  id integer [pk]
  producto_proveedor_id integer
  precio decimal
  moneda varchar
  precio_pesos decimal
  fecha_detectada timestamp
}

Ref: subcategorias.id_categoria > categorias.id
Ref: productos.id_categoria > categorias.id
Ref: productos.id_subcategoria > subcategorias.id
Ref: productos_proveedor.id_proveedor > proveedores.id
Ref: productos_proveedor.id_producto > productos.id
Ref: historial_precios.producto_proveedor_id > productos_proveedor.id