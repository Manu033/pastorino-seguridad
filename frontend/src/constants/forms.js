export const API_DEFAULT = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";
export const DOLAR_OFICIAL_URL = "https://dolarapi.com/v1/dolares/oficial";

export const emptyProveedor = { nombre: "", email_contacto: "", telefono: "", tipo_fuente: "MANUAL", activo: true };
export const emptyCategoria = { nombre: "" };
export const emptySubcategoria = { id_categoria: "", nombre: "" };
export const emptyProductoProveedor = {
  id_proveedor: "",
  id_categoria: "",
  id_subcategoria: "",
  sku_producto_proveedor: "",
  nombre_producto_proveedor: "",
  marca_producto_proveedor: "",
  modelo_producto_proveedor: "",
  descripcion: "",
  imagen_url: "",
  unidad: "",
  unidad_calculo: "",
  cantidad_por_unidad_compra: "",
  redondeo_compra: "",
  precio_actual: "",
  moneda_actual: "ARS",
  fecha_precio_actualizada: "",
  activo: true,
};

export const emptyCotizacionForm = {
  tipo: "EXTINCION",
  titulo: "",
  cliente: "",
  contacto_cliente: "",
  cuit_cliente: "",
  email_cliente: "",
  obra: "",
  fecha_emision: new Date().toISOString().slice(0, 10),
  validez_dias: "30",
  moneda_base: "USD",
  forma_pago: "Contado",
  plazo_entrega: "",
  observaciones: "",
  porcentaje_utilidad: "0",
  aplica_costos_varios: false,
  porcentaje_costos_varios: "5",
};
export const emptyCotizacionProducto = { buscar: "", idProveedor: "", idProducto: "", cantidad: "1" };
export const emptyCotizacionManual = { descripcion: "", cantidad: "1", unidad: "", precio_unitario: "", moneda: "ARS" };
export const emptyCotizacionManoObra = { personas: "1", dias: "1", precio_unitario: "", moneda: "ARS" };

export const PROMPT_EXTRACCION_PRECIOS = `Sos un asistente de extracción de datos para una empresa de seguridad contra incendios.
El archivo adjunto es una lista de precios de un proveedor.

Analizá el archivo adjunto y extraé TODOS los productos de TODAS las páginas del archivo. No devuelvas ejemplos ni una muestra parcial. El array JSON final debe contener un objeto por cada fila de producto detectada.

Necesito que devuelvas exclusivamente un JSON válido con un array de productos.

Cada producto debe tener exactamente esta estructura:

{
  "sku_producto_proveedor": "17002",
  "nombre_producto_proveedor": "Tubo CC Iram 2502 21.3x2.00mm",
  "marca_producto_proveedor": null,
  "modelo_producto_proveedor": null,
  "unidad": "tubo",
  "unidad_calculo": "mts",
  "cantidad_por_unidad_compra": 6.4,
  "redondeo_compra": "ARRIBA",
  "moneda": "USD",
  "precio": 1.68
}

Reglas importantes:

* Si un campo no existe o no puede determinarse claramente, devolver null.
* No inventar información.
* El campo "precio" debe ser numérico.
* El campo "moneda" debe normalizarse únicamente como:
  * "ARS"
  * "USD"
* El campo "unidad" representa la unidad comercial o unidad de compra del proveedor.
  Ejemplos: unid, caja, tubo, rollo, kg, mts.
* El campo "unidad_calculo" representa la unidad en la que se calcula la necesidad de obra.
  Ejemplos: mts, unid, kg.
* El campo "cantidad_por_unidad_compra" indica cuánto contiene una unidad de compra respecto de la unidad de cálculo.
  Ejemplos:
  * Si un tubo trae 6,4 metros:
    unidad = "tubo"
    unidad_calculo = "mts"
    cantidad_por_unidad_compra = 6.4
  * Si una caja trae 100 unidades:
    unidad = "caja"
    unidad_calculo = "unid"
    cantidad_por_unidad_compra = 100
  * Si no hay conversión clara:
    cantidad_por_unidad_compra = null
* El campo "redondeo_compra" debe normalizarse únicamente como:
  * "ARRIBA"
  * null
* Usar "ARRIBA" cuando el producto se compra por unidades indivisibles, como tubos, cajas, rollos, barras, bolsas o packs.
* Si el producto se puede comprar exactamente por la misma unidad de cálculo, usar:
  cantidad_por_unidad_compra = 1
  redondeo_compra = null
* Si el archivo no tiene un código o SKU explícito por producto, generá uno a partir del nombre
  del producto usando este formato: primeras 3 letras de las primeras 3 palabras significativas,
  todo en mayúsculas, separadas por guión. Ejemplo: "Tubo de acero galvanizado" → "TUB-ACE-GAL".
  Debe ser único dentro del array.
* No inferir medidas de compra si no están explícitas o no son claramente deducibles del texto del producto.
* Ignorar encabezados, subtítulos, observaciones y texto no relacionado a productos.
* Detectar correctamente tablas aunque el archivo sea PDF o tenga formato irregular.
* Cada fila de producto debe convertirse en un objeto independiente dentro del array JSON.
* El resultado final debe ser únicamente un JSON válido.
* No agregar explicaciones.
* No agregar texto fuera del JSON.

Formato esperado final:

[
  {
    "sku_producto_proveedor": "17002",
    "nombre_producto_proveedor": "Tubo CC Iram 2502 21.3x2.00mm",
    "marca_producto_proveedor": null,
    "modelo_producto_proveedor": null,
    "unidad": "tubo",
    "unidad_calculo": "mts",
    "cantidad_por_unidad_compra": 6.4,
    "redondeo_compra": "ARRIBA",
    "moneda": "USD",
    "precio": 1.68
  }
]`;

export const sampleImport = JSON.stringify(
  [
    {
      sku_producto_proveedor: "17002",
      nombre_producto_proveedor: "Tubo CC Iram 2502 21.3x2.00mm",
      marca_producto_proveedor: null,
      modelo_producto_proveedor: null,
      unidad: "mts",
      unidad_calculo: "mts",
      cantidad_por_unidad_compra: 1,
      redondeo_compra: null,
      moneda: "USD",
      precio: 1.68,
    },
  ],
  null,
  2,
);
