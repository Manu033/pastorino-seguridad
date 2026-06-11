# Pastorino Seguridad — Sistema de Cotizaciones

Sistema interno para gestión de precios de proveedores y generación de cotizaciones de instalaciones de seguridad contra incendios (detección y extinción).

## Stack

**Frontend** (`frontend/`) — React 19, Vite 6, Tailwind CSS 4, JavaScript/JSX
**Backend** (`backend/`) — Node.js, Express, TypeScript, Prisma 5, PostgreSQL, Zod

## Commands

```bash
# Backend (puerto 8001)
cd backend && npm run dev

# Frontend (puerto 5173)
cd frontend && npm run dev

# Build frontend
cd frontend && npm run build

# Prisma
cd backend && npm run prisma:migrate   # aplicar migraciones
cd backend && npm run prisma:studio    # explorar BD visualmente
```

Requiere `DATABASE_URL` en `backend/.env`.

## Project structure

```
frontend/src/
  App.jsx                        # Orquestador: compone hooks, renderiza tabs
  hooks/                         # Hooks compartidos
    useAppState.js               # apiUrl, status, error, loading, run()
    useHealth.js                 # health, dolarOficial, dolarVenta
    useBaseData.js               # proveedores, categorias, subcategorias
    useProductosBusqueda.js      # búsqueda de productos (compartida)
  features/{feature}/            # Hook + Tab + Modal por feature
    proveedores/
    productos/
    categorias/
    cotizaciones/                # + calculos.js, unidades.js, cotizacionPdf.js
    precios/
    importaciones/
  components/                    # UI genérica
  api/client.js                  # fetch wrapper
  constants/forms.js             # Vacíos de formularios, PROMPT_EXTRACCION_PRECIOS
  utils/format.js                # cleanText, toNumber, toNumberOrNull, normalizeSearch

backend/src/
  server.ts                      # Express app
  routes/                        # Un archivo por entidad
  schemas/                       # Zod schemas
  services/importService.ts      # Importación masiva con upsert + historial
prisma/schema.prisma             # Fuente de verdad del modelo de datos
```

## Architecture

**Frontend pattern:** cada feature tiene un custom hook (`useProveedores`, `useProductos`, etc.) que encapsula estado y handlers. Los componentes Tab/Modal son puramente presentacionales.

**Backend pattern:** rutas Express con validación Zod → servicios con Prisma. Sin capas adicionales.

## Data model

| Tabla | Descripción |
|-------|-------------|
| `proveedores` | Proveedor con `tipo_fuente` (EXCEL/PDF/API/MANUAL) |
| `productos_proveedor` | Producto por proveedor. Unique: `(id_proveedor, sku)`. Incluye campos de unidad de compra. |
| `historial_precios` | Registro inmutable de precios importados |
| `cotizaciones` | Presupuesto con tipo EXTINCION o DETECCION |
| `cotizacion_items` | Ítem tipo PRODUCTO o MANUAL |

- Precios: `Decimal(14,4)`. Monedas: `ARS` o `USD`.
- Cotizaciones trabajan internamente en USD usando el dólar oficial.
- Sin autenticación — sistema de uso interno.

## Key conventions

- Precios con punto decimal, nunca coma
- IVA no incluido en precios
- `redondeo_compra` acepta solo `"ARRIBA"` o `null`
- Importación masiva: el endpoint recibe JSON normalizado. El usuario convierte sus archivos (PDF/Excel/imagen) usando `PROMPT_EXTRACCION_PRECIOS` (constante en `constants/forms.js`) con Claude.ai o ChatGPT.
- No modificar el contrato de props de los feature components — los hooks son los que cambian.
- Al agregar una nueva feature: crear hook co-localizado en `features/{feature}/`, no poner lógica en App.jsx.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server status |
| GET/POST/PUT/DELETE | `/proveedores` | Proveedores CRUD |
| GET/POST/PUT/DELETE | `/productos-proveedor` | Productos con paginación y filtros |
| GET | `/productos-proveedor/:id/historial-precios` | Price history |
| GET | `/productos-proveedor/:id/ultimo-precio` | Latest price |
| POST | `/importaciones/:proveedorId/preview-json` | Validate without saving |
| POST | `/importaciones/:proveedorId/procesar-json` | Bulk import prices |
| GET/POST/PUT | `/cotizaciones` | Cotizaciones CRUD |
| GET/POST/PUT/DELETE | `/categorias` | Categorías CRUD |
| GET/POST/PUT/DELETE | `/subcategorias` | Subcategorías CRUD |
