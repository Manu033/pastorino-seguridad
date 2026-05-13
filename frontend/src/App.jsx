import React, { useEffect, useMemo, useState } from "react";
import Logo from "./assets/imagenes/logo-completo.jpg";

const API_DEFAULT = import.meta.env.VITE_API_URL || "http://127.0.0.1:8011";
const DOLAR_OFICIAL_URL = "https://dolarapi.com/v1/dolares/oficial";
const emptyProveedor = { nombre: "", email_contacto: "", telefono: "", tipo_fuente: "MANUAL", activo: true };
const emptyCategoria = { nombre: "" };
const emptySubcategoria = { id_categoria: "", nombre: "" };
const emptyProducto = {
  sku_interno: "",
  nombre_normalizado: "",
  id_categoria: "",
  id_subcategoria: "",
  marca: "",
  modelo: "",
  descripcion: "",
  imagen_url: "",
  activo: true,
};
const emptyProductoProveedor = {
  id_proveedor: "",
  id_producto: "",
  sku_producto_proveedor: "",
  nombre_producto_proveedor: "",
  marca_producto_proveedor: "",
  modelo_producto_proveedor: "",
  unidad: "",
  precio_actual: "",
  moneda_actual: "ARS",
  fecha_precio_actualizada: "",
  activo: true,
};
const sampleImport = JSON.stringify(
  [
    {
      sku_producto_proveedor: "17002",
      nombre_producto_proveedor: "Tubo CC Iram 2502 21.3x2.00mm",
      marca_producto_proveedor: null,
      modelo_producto_proveedor: null,
      unidad: "mts",
      moneda: "USD",
      precio: 1.68,
    },
  ],
  null,
  2,
);

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}

function cleanText(value) {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

function formatMoney(value, currency) {
  if (value === null || value === undefined || value === "") return "-";
  return `${currency || ""} ${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`.trim();
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR");
}

function formatShortDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

async function request(apiUrl, path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const detail = data?.message || data?.error || JSON.stringify(data);
    throw new Error(detail || `Error HTTP ${response.status}`);
  }
  return data;
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, type = "text", placeholder = "" }) {
  return <input type={type} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

function Select({ value, onChange, children }) {
  return <select value={value ?? ""} onChange={(event) => onChange(event.target.value)}>{children}</select>;
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="check">
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Actions({ children }) {
  return <div className="actions">{children}</div>;
}

function Status({ message, error }) {
  if (!message && !error) return null;
  return <div className={error ? "status error" : "status"}>{error || message}</div>;
}

function App() {
  const [apiUrl, setApiUrl] = useState(API_DEFAULT);
  const [activeTab, setActiveTab] = useState("proveedores");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState("sin comprobar");
  const [dolarOficial, setDolarOficial] = useState(null);
  const [dolarError, setDolarError] = useState("");

  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [ultimoPrecio, setUltimoPrecio] = useState(null);

  const [proveedorForm, setProveedorForm] = useState(emptyProveedor);
  const [categoriaForm, setCategoriaForm] = useState(emptyCategoria);
  const [subcategoriaForm, setSubcategoriaForm] = useState(emptySubcategoria);
  const [productoForm, setProductoForm] = useState(emptyProducto);
  const [productoProveedorForm, setProductoProveedorForm] = useState(emptyProductoProveedor);
  const [editing, setEditing] = useState({});

  const [filters, setFilters] = useState({
    incluirInactivos: false,
    buscarProducto: "",
    buscarProductoProveedor: "",
    idProveedorProducto: "",
    idProductoProveedor: "",
    soloPendientes: false,
  });
  const [linkForm, setLinkForm] = useState({ id_producto_proveedor: "", id_producto: "" });
  const [historialId, setHistorialId] = useState("");
  const [importProveedorId, setImportProveedorId] = useState("");
  const [importJson, setImportJson] = useState(sampleImport);
  const [importResult, setImportResult] = useState(null);

  const subcategoriasProducto = useMemo(
    () => subcategorias.filter((item) => String(item.id_categoria) === String(productoForm.id_categoria)),
    [subcategorias, productoForm.id_categoria],
  );

  async function run(label, callback) {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await callback();
      setStatus(label);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function loadBaseData() {
    await run("Datos actualizados", async () => {
      const [proveedoresData, categoriasData, subcategoriasData] = await Promise.all([
        request(apiUrl, `/proveedores?incluir_inactivos=${filters.incluirInactivos}`),
        request(apiUrl, "/categorias"),
        request(apiUrl, "/subcategorias"),
      ]);
      setProveedores(proveedoresData);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
    });
  }

  async function loadProductos() {
    await run("Productos actualizados", async () => {
      const query = new URLSearchParams({
        incluir_inactivos: String(filters.incluirInactivos),
        ...(filters.buscarProducto ? { buscar: filters.buscarProducto } : {}),
      });
      setProductos(await request(apiUrl, `/productos?${query}`));
    });
  }

  async function loadProductosProveedor() {
    await run("Productos de proveedor actualizados", async () => {
      const query = new URLSearchParams({
        ...(filters.buscarProductoProveedor ? { buscar: filters.buscarProductoProveedor } : {}),
        ...(filters.idProveedorProducto ? { id_proveedor: filters.idProveedorProducto } : {}),
        ...(filters.idProductoProveedor ? { id_producto: filters.idProductoProveedor } : {}),
      });
      const path = filters.soloPendientes ? `/productos-proveedor/pendientes?${query}` : `/productos-proveedor?${query}`;
      const data = await request(apiUrl, path);
      if (filters.soloPendientes) setPendientes(data);
      setProductosProveedor(data);
    });
  }

  async function checkHealth() {
    await run("API disponible", async () => {
      const data = await request(apiUrl, "/health");
      setHealth(data.status);
    });
  }

  async function loadDolarOficial() {
    try {
      setDolarError("");
      const response = await fetch(DOLAR_OFICIAL_URL);
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      const data = await response.json();
      setDolarOficial(data);
    } catch (err) {
      setDolarOficial(null);
      setDolarError(err instanceof Error ? err.message : "No se pudo consultar el dolar");
    }
  }

  useEffect(() => {
    loadBaseData();
    loadProductos();
    loadProductosProveedor();
    checkHealth();
    loadDolarOficial();
  }, []);

  function proveedorPayload(form) {
    return {
      nombre: form.nombre,
      email_contacto: cleanText(form.email_contacto),
      telefono: cleanText(form.telefono),
      tipo_fuente: form.tipo_fuente,
      activo: Boolean(form.activo),
    };
  }

  function productoPayload(form) {
    return {
      sku_interno: form.sku_interno,
      nombre_normalizado: form.nombre_normalizado,
      id_categoria: Number(form.id_categoria),
      id_subcategoria: toNumberOrNull(form.id_subcategoria),
      marca: cleanText(form.marca),
      modelo: cleanText(form.modelo),
      descripcion: cleanText(form.descripcion),
      imagen_url: cleanText(form.imagen_url),
      activo: Boolean(form.activo),
    };
  }

  function productoProveedorPayload(form) {
    return {
      id_proveedor: Number(form.id_proveedor),
      id_producto: toNumberOrNull(form.id_producto),
      sku_producto_proveedor: form.sku_producto_proveedor,
      nombre_producto_proveedor: form.nombre_producto_proveedor,
      marca_producto_proveedor: cleanText(form.marca_producto_proveedor),
      modelo_producto_proveedor: cleanText(form.modelo_producto_proveedor),
      unidad: cleanText(form.unidad),
      precio_actual: toNumberOrNull(form.precio_actual),
      moneda_actual: form.moneda_actual || null,
      fecha_precio_actualizada: form.fecha_precio_actualizada ? new Date(form.fecha_precio_actualizada).toISOString() : null,
      activo: Boolean(form.activo),
    };
  }

  async function saveProveedor(event) {
    event.preventDefault();
    await run("Proveedor guardado", async () => {
      const id = editing.proveedor;
      await request(apiUrl, id ? `/proveedores/${id}` : "/proveedores", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(proveedorPayload(proveedorForm)),
      });
      setProveedorForm(emptyProveedor);
      setEditing((value) => ({ ...value, proveedor: null }));
      await loadBaseData();
    });
  }

  async function saveCategoria(event) {
    event.preventDefault();
    await run("Categoria guardada", async () => {
      const id = editing.categoria;
      await request(apiUrl, id ? `/categorias/${id}` : "/categorias", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ nombre: categoriaForm.nombre }),
      });
      setCategoriaForm(emptyCategoria);
      setEditing((value) => ({ ...value, categoria: null }));
      await loadBaseData();
    });
  }

  async function saveSubcategoria(event) {
    event.preventDefault();
    await run("Subcategoria guardada", async () => {
      const id = editing.subcategoria;
      await request(apiUrl, id ? `/subcategorias/${id}` : "/subcategorias", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ id_categoria: Number(subcategoriaForm.id_categoria), nombre: subcategoriaForm.nombre }),
      });
      setSubcategoriaForm(emptySubcategoria);
      setEditing((value) => ({ ...value, subcategoria: null }));
      await loadBaseData();
    });
  }

  async function saveProducto(event) {
    event.preventDefault();
    await run("Producto guardado", async () => {
      const id = editing.producto;
      await request(apiUrl, id ? `/productos/${id}` : "/productos", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(productoPayload(productoForm)),
      });
      setProductoForm(emptyProducto);
      setEditing((value) => ({ ...value, producto: null }));
      await loadProductos();
    });
  }

  async function saveProductoProveedor(event) {
    event.preventDefault();
    await run("Producto de proveedor guardado", async () => {
      const id = editing.productoProveedor;
      await request(apiUrl, id ? `/productos-proveedor/${id}` : "/productos-proveedor", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(productoProveedorPayload(productoProveedorForm)),
      });
      setProductoProveedorForm(emptyProductoProveedor);
      setEditing((value) => ({ ...value, productoProveedor: null }));
      await loadProductosProveedor();
    });
  }

  async function softDelete(kind, id) {
    const label = kind === "proveedor" ? "Proveedor desactivado" : "Producto desactivado";
    const path = kind === "proveedor" ? `/proveedores/${id}` : `/productos/${id}`;
    await run(label, async () => {
      await request(apiUrl, path, { method: "DELETE" });
      if (kind === "proveedor") await loadBaseData();
      if (kind === "producto") await loadProductos();
    });
  }

  async function vincularProducto(event) {
    event.preventDefault();
    await run("Producto vinculado", async () => {
      await request(apiUrl, `/productos-proveedor/${linkForm.id_producto_proveedor}/vincular`, {
        method: "POST",
        body: JSON.stringify({ id_producto: Number(linkForm.id_producto) }),
      });
      setLinkForm({ id_producto_proveedor: "", id_producto: "" });
      await loadProductosProveedor();
    });
  }

  async function desvincularProducto(id) {
    await run("Producto desvinculado", async () => {
      await request(apiUrl, `/productos-proveedor/${id}/desvincular`, { method: "POST", body: JSON.stringify({}) });
      await loadProductosProveedor();
    });
  }

  async function loadHistorial(event) {
    event.preventDefault();
    await run("Historial cargado", async () => {
      const [historialData, ultimoData] = await Promise.all([
        request(apiUrl, `/productos-proveedor/${historialId}/historial-precios`),
        request(apiUrl, `/productos-proveedor/${historialId}/ultimo-precio`),
      ]);
      setHistorial(historialData);
      setUltimoPrecio(ultimoData);
    });
  }

  async function importarJson(preview) {
    await run(preview ? "Preview validado" : "Importacion procesada", async () => {
      const parsed = JSON.parse(importJson);
      const data = await request(apiUrl, `/importaciones/${importProveedorId}/${preview ? "preview-json" : "procesar-json"}`, {
        method: "POST",
        body: JSON.stringify(parsed),
      });
      setImportResult(data);
      if (!preview) await loadProductosProveedor();
    });
  }

  const tabs = [
    ["proveedores", "Proveedores"],
    ["categorias", "Categorias"],
    ["productos", "Productos"],
    ["productosProveedor", "Proveedor productos"],
    ["vinculos", "Vinculos"],
    ["historial", "Precios"],
    ["importaciones", "Importacion JSON"],
  ];

  return (
    <main>
      <header className="topbar">
        <div>
          <img src={Logo} alt="Logo Pastorino" className="Logo" />
          <p>Administracion de proveedores, productos e historial de precios.</p>
        </div>
        <div className="apiBox">
          <div className="dolarBox">
            <span>Dolar oficial</span>
            <strong>{dolarOficial ? formatMoney(dolarOficial.venta, "ARS") : "-"}</strong>
            <small>
              {dolarError || (dolarOficial?.fechaActualizacion ? `Act. ${formatShortDate(dolarOficial.fechaActualizacion)}` : "Venta")}
            </small>
          </div>
          <Field label="API">
            <TextInput value={apiUrl} onChange={setApiUrl} />
          </Field>
          <button type="button" onClick={checkHealth}>Comprobar</button>
          <span className="pill">Health: {health}</span>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map(([id, label]) => (
          <button type="button" className={activeTab === id ? "active" : ""} key={id} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      <Status message={status} error={error} />
      {loading && <div className="loading">Procesando...</div>}

      {activeTab === "proveedores" && (
        <section className="grid categoryGrid">
          <form className="panel" onSubmit={saveProveedor}>
            <h2>{editing.proveedor ? "Editar proveedor" : "Nuevo proveedor"}</h2>
            <Field label="Nombre"><TextInput value={proveedorForm.nombre} onChange={(nombre) => setProveedorForm({ ...proveedorForm, nombre })} /></Field>
            <Field label="Email"><TextInput value={proveedorForm.email_contacto} onChange={(email_contacto) => setProveedorForm({ ...proveedorForm, email_contacto })} /></Field>
            <Field label="Telefono"><TextInput value={proveedorForm.telefono} onChange={(telefono) => setProveedorForm({ ...proveedorForm, telefono })} /></Field>
            <Field label="Tipo fuente">
              <Select value={proveedorForm.tipo_fuente} onChange={(tipo_fuente) => setProveedorForm({ ...proveedorForm, tipo_fuente })}>
                <option>MANUAL</option><option>EXCEL</option><option>PDF</option><option>API</option>
              </Select>
            </Field>
            <Checkbox label="Activo" checked={proveedorForm.activo} onChange={(activo) => setProveedorForm({ ...proveedorForm, activo })} />
            <Actions>
              <button type="submit">Guardar</button>
              <button type="button" className="secondary" onClick={() => { setProveedorForm(emptyProveedor); setEditing({ ...editing, proveedor: null }); }}>Limpiar</button>
              <button type="button" className="secondary" onClick={loadBaseData}>Actualizar</button>
            </Actions>
          </form>
          <section className="panel wide">
            <div className="panelHead">
              <h2>Listado</h2>
              <Checkbox label="Incluir inactivos" checked={filters.incluirInactivos} onChange={(incluirInactivos) => setFilters({ ...filters, incluirInactivos })} />
            </div>
            <table><thead><tr><th>ID</th><th>Nombre</th><th>Fuente</th><th>Contacto</th><th>Activo</th><th></th></tr></thead><tbody>
              {proveedores.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td><td>{item.nombre}</td><td>{item.tipo_fuente}</td><td>{item.email_contacto || item.telefono || "-"}</td><td>{item.activo ? "Si" : "No"}</td>
                  <td className="rowActions">
                    <button type="button" onClick={() => { setProveedorForm(item); setEditing({ ...editing, proveedor: item.id }); }}>Editar</button>
                    <button type="button" className="danger" onClick={() => softDelete("proveedor", item.id)}>Desactivar</button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          </section>
        </section>
      )}

      {activeTab === "categorias" && (
        <section className="grid">
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
          <section className="panel wide">
            <h2>Categorias y subcategorias</h2>
            <table><thead><tr><th>ID</th><th>Categoria</th><th>Subcategorias</th><th></th></tr></thead><tbody>
              {categorias.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td><td>{cat.nombre}</td>
                  <td>{subcategorias.filter((sub) => sub.id_categoria === cat.id).map((sub) => sub.nombre).join(", ") || "-"}</td>
                  <td><button type="button" onClick={() => { setCategoriaForm(cat); setEditing({ ...editing, categoria: cat.id }); }}>Editar</button></td>
                </tr>
              ))}
            </tbody></table>
            <h3>Subcategorias</h3>
            <table><thead><tr><th>ID</th><th>Categoria</th><th>Nombre</th><th></th></tr></thead><tbody>
              {subcategorias.map((sub) => (
                <tr key={sub.id}><td>{sub.id}</td><td>{categorias.find((cat) => cat.id === sub.id_categoria)?.nombre || sub.id_categoria}</td><td>{sub.nombre}</td><td><button type="button" onClick={() => { setSubcategoriaForm(sub); setEditing({ ...editing, subcategoria: sub.id }); }}>Editar</button></td></tr>
              ))}
            </tbody></table>
          </section>
        </section>
      )}

      {activeTab === "productos" && (
        <section className="grid">
          <form className="panel" onSubmit={saveProducto}>
            <h2>{editing.producto ? "Editar producto" : "Nuevo producto"}</h2>
            <Field label="SKU interno"><TextInput value={productoForm.sku_interno} onChange={(sku_interno) => setProductoForm({ ...productoForm, sku_interno })} /></Field>
            <Field label="Nombre normalizado"><TextInput value={productoForm.nombre_normalizado} onChange={(nombre_normalizado) => setProductoForm({ ...productoForm, nombre_normalizado })} /></Field>
            <Field label="Categoria"><Select value={productoForm.id_categoria} onChange={(id_categoria) => setProductoForm({ ...productoForm, id_categoria, id_subcategoria: "" })}><option value="">Seleccionar</option>{categorias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
            <Field label="Subcategoria"><Select value={productoForm.id_subcategoria || ""} onChange={(id_subcategoria) => setProductoForm({ ...productoForm, id_subcategoria })}><option value="">Sin subcategoria</option>{subcategoriasProducto.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
            <Field label="Marca"><TextInput value={productoForm.marca} onChange={(marca) => setProductoForm({ ...productoForm, marca })} /></Field>
            <Field label="Modelo"><TextInput value={productoForm.modelo} onChange={(modelo) => setProductoForm({ ...productoForm, modelo })} /></Field>
            <Field label="Descripcion"><textarea value={productoForm.descripcion || ""} onChange={(event) => setProductoForm({ ...productoForm, descripcion: event.target.value })} /></Field>
            <Field label="Imagen URL"><TextInput value={productoForm.imagen_url} onChange={(imagen_url) => setProductoForm({ ...productoForm, imagen_url })} /></Field>
            <Checkbox label="Activo" checked={productoForm.activo} onChange={(activo) => setProductoForm({ ...productoForm, activo })} />
            <Actions><button type="submit">Guardar</button><button type="button" className="secondary" onClick={() => { setProductoForm(emptyProducto); setEditing({ ...editing, producto: null }); }}>Limpiar</button></Actions>
          </form>
          <section className="panel wide">
            <div className="filters">
              <Field label="Buscar"><TextInput value={filters.buscarProducto} onChange={(buscarProducto) => setFilters({ ...filters, buscarProducto })} /></Field>
              <Checkbox label="Incluir inactivos" checked={filters.incluirInactivos} onChange={(incluirInactivos) => setFilters({ ...filters, incluirInactivos })} />
              <button type="button" onClick={loadProductos}>Buscar</button>
            </div>
            <table><thead><tr><th>ID</th><th>SKU</th><th>Nombre</th><th>Categoria</th><th>Activo</th><th></th></tr></thead><tbody>
              {productos.map((item) => (
                <tr key={item.id}><td>{item.id}</td><td>{item.sku_interno}</td><td>{item.nombre_normalizado}</td><td>{categorias.find((cat) => cat.id === item.id_categoria)?.nombre || item.id_categoria}</td><td>{item.activo ? "Si" : "No"}</td><td className="rowActions"><button type="button" onClick={() => { setProductoForm({ ...item, id_subcategoria: item.id_subcategoria || "" }); setEditing({ ...editing, producto: item.id }); }}>Editar</button><button type="button" className="danger" onClick={() => softDelete("producto", item.id)}>Desactivar</button></td></tr>
              ))}
            </tbody></table>
          </section>
        </section>
      )}

      {activeTab === "productosProveedor" && (
        <section className="grid">
          <form className="panel" onSubmit={saveProductoProveedor}>
            <h2>{editing.productoProveedor ? "Editar producto proveedor" : "Nuevo producto proveedor"}</h2>
            <Field label="Proveedor"><Select value={productoProveedorForm.id_proveedor} onChange={(id_proveedor) => setProductoProveedorForm({ ...productoProveedorForm, id_proveedor })}><option value="">Seleccionar</option>{proveedores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
            <Field label="Producto interno"><Select value={productoProveedorForm.id_producto || ""} onChange={(id_producto) => setProductoProveedorForm({ ...productoProveedorForm, id_producto })}><option value="">Sin vincular</option>{productos.map((item) => <option key={item.id} value={item.id}>{item.sku_interno} - {item.nombre_normalizado}</option>)}</Select></Field>
            <Field label="SKU proveedor"><TextInput value={productoProveedorForm.sku_producto_proveedor} onChange={(sku_producto_proveedor) => setProductoProveedorForm({ ...productoProveedorForm, sku_producto_proveedor })} /></Field>
            <Field label="Nombre proveedor"><TextInput value={productoProveedorForm.nombre_producto_proveedor} onChange={(nombre_producto_proveedor) => setProductoProveedorForm({ ...productoProveedorForm, nombre_producto_proveedor })} /></Field>
            <Field label="Marca"><TextInput value={productoProveedorForm.marca_producto_proveedor} onChange={(marca_producto_proveedor) => setProductoProveedorForm({ ...productoProveedorForm, marca_producto_proveedor })} /></Field>
            <Field label="Modelo"><TextInput value={productoProveedorForm.modelo_producto_proveedor} onChange={(modelo_producto_proveedor) => setProductoProveedorForm({ ...productoProveedorForm, modelo_producto_proveedor })} /></Field>
            <Field label="Unidad"><TextInput value={productoProveedorForm.unidad} onChange={(unidad) => setProductoProveedorForm({ ...productoProveedorForm, unidad })} /></Field>
            <Field label="Precio actual"><TextInput type="number" value={productoProveedorForm.precio_actual} onChange={(precio_actual) => setProductoProveedorForm({ ...productoProveedorForm, precio_actual })} /></Field>
            <Field label="Moneda"><Select value={productoProveedorForm.moneda_actual || ""} onChange={(moneda_actual) => setProductoProveedorForm({ ...productoProveedorForm, moneda_actual })}><option value="">Sin moneda</option><option>ARS</option><option>USD</option></Select></Field>
            <Field label="Fecha precio"><TextInput type="datetime-local" value={productoProveedorForm.fecha_precio_actualizada || ""} onChange={(fecha_precio_actualizada) => setProductoProveedorForm({ ...productoProveedorForm, fecha_precio_actualizada })} /></Field>
            <Checkbox label="Activo" checked={productoProveedorForm.activo} onChange={(activo) => setProductoProveedorForm({ ...productoProveedorForm, activo })} />
            <Actions><button type="submit">Guardar</button><button type="button" className="secondary" onClick={() => { setProductoProveedorForm(emptyProductoProveedor); setEditing({ ...editing, productoProveedor: null }); }}>Limpiar</button></Actions>
          </form>
          <section className="panel wide">
            <div className="filters">
              <Field label="Buscar"><TextInput value={filters.buscarProductoProveedor} onChange={(buscarProductoProveedor) => setFilters({ ...filters, buscarProductoProveedor })} /></Field>
              <Field label="Proveedor"><Select value={filters.idProveedorProducto} onChange={(idProveedorProducto) => setFilters({ ...filters, idProveedorProducto })}><option value="">Todos</option>{proveedores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
              <Checkbox label="Solo pendientes" checked={filters.soloPendientes} onChange={(soloPendientes) => setFilters({ ...filters, soloPendientes })} />
              <button type="button" onClick={loadProductosProveedor}>Buscar</button>
            </div>
            <table><thead><tr><th>ID</th><th>Proveedor</th><th>SKU</th><th>Nombre</th><th>Vinculo</th><th>Precio</th><th></th></tr></thead><tbody>
              {productosProveedor.map((item) => (
                <tr key={item.id}><td>{item.id}</td><td>{item.proveedor?.nombre || item.id_proveedor}</td><td>{item.sku_producto_proveedor}</td><td>{item.nombre_producto_proveedor}</td><td>{item.producto?.sku_interno || "-"}</td><td>{formatMoney(item.precio_actual, item.moneda_actual)}</td><td className="rowActions"><button type="button" onClick={() => { setProductoProveedorForm({ ...item, id_producto: item.id_producto || "", fecha_precio_actualizada: item.fecha_precio_actualizada ? item.fecha_precio_actualizada.slice(0, 16) : "" }); setEditing({ ...editing, productoProveedor: item.id }); }}>Editar</button><button type="button" className="secondary" onClick={() => desvincularProducto(item.id)}>Desvincular</button></td></tr>
              ))}
            </tbody></table>
          </section>
        </section>
      )}

      {activeTab === "vinculos" && (
        <section className="grid">
          <form className="panel" onSubmit={vincularProducto}>
            <h2>Vincular producto proveedor</h2>
            <Field label="Producto proveedor"><Select value={linkForm.id_producto_proveedor} onChange={(id_producto_proveedor) => setLinkForm({ ...linkForm, id_producto_proveedor })}><option value="">Seleccionar</option>{productosProveedor.map((item) => <option key={item.id} value={item.id}>{item.sku_producto_proveedor} - {item.nombre_producto_proveedor}</option>)}</Select></Field>
            <Field label="Producto interno"><Select value={linkForm.id_producto} onChange={(id_producto) => setLinkForm({ ...linkForm, id_producto })}><option value="">Seleccionar</option>{productos.map((item) => <option key={item.id} value={item.id}>{item.sku_interno} - {item.nombre_normalizado}</option>)}</Select></Field>
            <Actions><button type="submit">Vincular</button><button type="button" className="secondary" onClick={loadProductosProveedor}>Actualizar</button></Actions>
          </form>
          <section className="panel wide">
            <h2>Pendientes</h2>
            <button type="button" onClick={async () => { setFilters({ ...filters, soloPendientes: true }); await loadProductosProveedor(); }}>Cargar pendientes</button>
            <table><thead><tr><th>ID</th><th>Proveedor</th><th>SKU</th><th>Nombre</th><th></th></tr></thead><tbody>
              {(pendientes.length ? pendientes : productosProveedor.filter((item) => !item.id_producto)).map((item) => (
                <tr key={item.id}><td>{item.id}</td><td>{item.proveedor?.nombre || item.id_proveedor}</td><td>{item.sku_producto_proveedor}</td><td>{item.nombre_producto_proveedor}</td><td><button type="button" onClick={() => setLinkForm({ ...linkForm, id_producto_proveedor: item.id })}>Usar</button></td></tr>
              ))}
            </tbody></table>
          </section>
        </section>
      )}

      {activeTab === "historial" && (
        <section className="grid">
          <form className="panel" onSubmit={loadHistorial}>
            <h2>Consultar precios</h2>
            <Field label="Producto proveedor"><Select value={historialId} onChange={setHistorialId}><option value="">Seleccionar</option>{productosProveedor.map((item) => <option key={item.id} value={item.id}>{item.sku_producto_proveedor} - {item.nombre_producto_proveedor}</option>)}</Select></Field>
            <Actions><button type="submit">Consultar</button></Actions>
            {ultimoPrecio && <div className="summary"><strong>Ultimo precio</strong><span>{formatMoney(ultimoPrecio.precio, ultimoPrecio.moneda)}</span><small>{formatDate(ultimoPrecio.fecha_actualizada)}</small></div>}
          </form>
          <section className="panel wide">
            <h2>Historial</h2>
            <table><thead><tr><th>ID</th><th>Precio</th><th>Moneda</th><th>Fecha</th></tr></thead><tbody>
              {historial.map((item) => <tr key={item.id}><td>{item.id}</td><td>{formatMoney(item.precio, item.moneda)}</td><td>{item.moneda}</td><td>{formatDate(item.fecha_actualizada)}</td></tr>)}
            </tbody></table>
          </section>
        </section>
      )}

      {activeTab === "importaciones" && (
        <section className="grid">
          <section className="panel">
            <h2>Importar JSON normalizado</h2>
            <Field label="Proveedor"><Select value={importProveedorId} onChange={setImportProveedorId}><option value="">Seleccionar</option>{proveedores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
            <textarea className="jsonArea" value={importJson} onChange={(event) => setImportJson(event.target.value)} />
            <Actions><button type="button" onClick={() => importarJson(true)}>Preview</button><button type="button" onClick={() => importarJson(false)}>Procesar</button></Actions>
          </section>
          <section className="panel wide">
            <h2>Resultado</h2>
            <pre>{importResult ? JSON.stringify(importResult, null, 2) : "Sin resultado"}</pre>
          </section>
        </section>
      )}
    </main>
  );
}

export default App;
