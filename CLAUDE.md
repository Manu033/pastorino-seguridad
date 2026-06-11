# Pastorino Seguridad — Sistema de Cotizaciones

Sistema interno para gestión de precios de proveedores y generación de cotizaciones de instalaciones de seguridad contra incendios (detección y extinción).

## Stack

**Frontend** — `frontend/`
- React 19 + Vite 6
- Tailwind CSS 4
- JavaScript (`.jsx`) — TypeScript instalado pero no migrado aún
- `lucide-react` para iconos
- `react-to-print` para PDF de cotizaciones

**Backend** — `backend/`
- Node.js + Express + TypeScript (`tsx` en dev)
- Prisma 5 con PostgreSQL
- Zod para validación de schemas en rutas

## Cómo correr el proyecto

```bash
# Backend
cd backend
npm run dev          # Express en puerto 8001

# Frontend
cd frontend
npm run dev          # Vite en puerto 5173
```

La variable de entorno `DATABASE_URL` debe estar configurada en `backend/.env`.

## Arquitectura frontend

```
src/
  App.jsx                  # Orquestador delgado — solo compone hooks y renderiza tabs
  hooks/                   # Hooks compartidos entre features
    useAppState.js         # apiUrl, status, error, loading, run()
    useHealth.js           # health, dolarOficial, dolarVenta
    useBaseData.js         # proveedores, categorias, subcategorias
    useProductosBusqueda.js # productosBusqueda (usado por cotizaciones e historial)
  features/
    proveedores/           # useProveedores.js + ProveedoresTab.jsx + ProveedorModal.jsx
    productos/             # useProductos.js + ProductosTab.jsx + ProductoModal.jsx
    categorias/            # useCategorias.js + CategoriasTab.jsx
    cotizaciones/          # useCotizaciones.js + CotizacionesTab.jsx + CotizacionModal.jsx
                           # calculos.js, unidades.js, cotizacionPdf.js
    precios/               # useHistorial.js + HistorialPreciosTab.jsx
    importaciones/         # useImportaciones.js + ImportacionesTab.jsx
  components/              # Componentes UI genéricos (AppHeader, ui.jsx)
  api/client.js            # fetch wrapper
  constants/forms.js       # Estados vacíos, PROMPT_EXTRACCION_PRECIOS, sampleImport
  utils/format.js          # cleanText, toNumber, toNumberOrNull, normalizeSearch
```

**Patrón:** cada feature tiene un custom hook que encapsula su estado y handlers. Los feature components son presentacionales — reciben todo por props desde el hook.

## Arquitectura backend

```
src/
  server.ts                # Express app, registra rutas
  routes/
    proveedores.ts
    categorias.ts
    subcategorias.ts
    productosProveedor.ts
    cotizaciones.ts
    importaciones.ts       # POST /:proveedorId/preview-json y /procesar-json
    historialPrecios.ts
  schemas/                 # Zod schemas por entidad
  services/
    importService.ts       # Lógica de importación masiva con upsert + historial
```

## Modelo de datos clave

- **`proveedores`** — proveedor con `tipo_fuente` (EXCEL/PDF/API/MANUAL)
- **`productos_proveedor`** — entidad central. Un producto tal como lo vende un proveedor. Unique key: `(id_proveedor, sku_producto_proveedor)`. Incluye campos de unidad de compra (`unidad`, `unidad_calculo`, `cantidad_por_unidad_compra`, `redondeo_compra`) para calcular cuánto se compra al cotizar.
- **`historial_precios`** — registro inmutable de cada precio importado.
- **`cotizaciones`** — presupuesto con items. Tipo: EXTINCION o DETECCION.
- **`cotizacion_items`** — ítem de cotizacion (PRODUCTO o MANUAL).

Todos los precios son `Decimal(14,4)`. Monedas: `ARS` o `USD`. Las cotizaciones trabajan en USD internamente usando el dólar oficial de `dolarapi.com`.

## Convenciones

- Precios siempre en decimales con punto (nunca coma)
- IVA **no** está incluido en los precios — se calcula por fuera
- El campo `redondeo_compra` solo acepta `"ARRIBA"` o `null`
- Importación masiva: el JSON debe llegar normalizado al backend. El usuario usa `PROMPT_EXTRACCION_PRECIOS` en Claude.ai/ChatGPT para convertir sus archivos (PDF/Excel/imagen) al formato esperado.
- No hay autenticación — es un sistema de uso interno

## Rutas de API relevantes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/proveedores` | Lista con `?incluir_inactivos=true` |
| GET/POST/PUT/DELETE | `/proveedores/:id` | CRUD proveedores |
| GET/POST/PUT/DELETE | `/productos-proveedor` | CRUD con paginación y filtros |
| GET | `/productos-proveedor/:id/historial-precios` | Historial de precios |
| POST | `/importaciones/:proveedorId/preview-json` | Validar sin impactar BD |
| POST | `/importaciones/:proveedorId/procesar-json` | Importar precios en masa |
| GET/POST | `/cotizaciones` | Lista y creación |
| PUT | `/cotizaciones/:id` | Edición |
| GET | `/health` | Estado del servidor |
