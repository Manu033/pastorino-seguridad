# Pastorino Seguridad API Node

Backend MVP en Node.js + TypeScript para manejar proveedores, productos de proveedor e historial de precios.

## Stack

- Node.js 20+
- Express
- TypeScript
- PostgreSQL
- Prisma
- Zod

## Configuracion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env`:

```bash
copy .env.example .env
```

3. Editar `DATABASE_URL` si tu Postgres usa otros datos.

4. Crear tablas:

```bash
npm run prisma:migrate
```

5. Levantar API:

```bash
npm run dev
```

La API queda en:

```txt
http://127.0.0.1:8001
```

Healthcheck:

```http
GET /health
```

## Endpoints principales

```txt
GET    /proveedores
POST   /proveedores
GET    /proveedores/:id
PUT    /proveedores/:id
DELETE /proveedores/:id

GET    /categorias
POST   /categorias
PUT    /categorias/:id

GET    /subcategorias
POST   /subcategorias
PUT    /subcategorias/:id

GET    /productos-proveedor
POST   /productos-proveedor
PUT    /productos-proveedor/:id

POST   /importaciones/:proveedorId/preview-json
POST   /importaciones/:proveedorId/procesar-json

GET    /productos-proveedor/:id/ultimo-precio
GET    /productos-proveedor/:id/historial-precios

GET    /cotizaciones
POST   /cotizaciones
GET    /cotizaciones/:id
PUT    /cotizaciones/:id
```

## Importacion JSON

`procesar-json` crea o actualiza `productos_proveedor` por `id_proveedor + sku_producto_proveedor`, actualiza el precio actual y guarda una fila nueva en `historial_precios`.

```json
[
  {
    "sku_producto_proveedor": "17002",
    "nombre_producto_proveedor": "Tubo CC Iram 2502 21.3x2.00mm",
    "marca_producto_proveedor": null,
    "modelo_producto_proveedor": null,
    "unidad": "mts",
    "moneda": "USD",
    "precio": 1.68
  }
]
```

## Modelo de precios

`productos_proveedor` guarda el precio vigente:

```txt
precio_actual
moneda_actual
fecha_precio_actualizada
```

`historial_precios` conserva cada precio importado para auditoria y evolucion historica.
