import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  Droplets,
  Flame,
  Hammer,
  PackageSearch,
  Plus,
  Printer,
  Trash2,
  Wrench,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { emptyCotizacionForm } from "../../constants/forms.js";
import { formatDate, formatMoney, toNumber } from "../../utils/format.js";

type Moneda = "USD" | "ARS";
type TipoCotizacion = "EXTINCION" | "DETECCION" | "SALA_BOMBAS";
type ItemGrupo = "MATERIAL" | "MANO_OBRA";
type FormulaAccesorioAutomatico = "PERA" | "SOPORTE" | "ACOPLE";

type CotizacionForm = {
  tipo: TipoCotizacion;
  titulo: string;
  cliente: string;
  contacto_cliente?: string;
  cuit_cliente?: string;
  email_cliente?: string;
  obra: string;
  telefono_obra?: string;
  fecha_emision?: string;
  validez_dias?: string;
  moneda_base?: Moneda;
  forma_pago?: string;
  plazo_entrega?: string;
  observaciones: string;
  porcentaje_utilidad: string;
  aplica_costos_varios: boolean;
  porcentaje_costos_varios: string;
};

type CotizacionItem = {
  localId: string;
  id_producto_proveedor: number | null;
  tipo: "PRODUCTO" | "MANUAL";
  grupo?: ItemGrupo;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  moneda: Moneda;
  total_usd: number;
  metros_requeridos?: number | null;
  generado_automaticamente?: boolean;
  formula_automatica?: FormulaAccesorioAutomatico | null;
  accesorio_origen_local_id?: string;
};

type Producto = {
  id: number;
  id_proveedor: number;
  id_categoria?: number | null;
  id_subcategoria?: number | null;
  sku_producto_proveedor: string;
  nombre_producto_proveedor: string;
  unidad?: string | null;
  cantidad_por_unidad_compra?: string | number | null;
  precio_actual?: string | number | null;
  moneda_actual?: Moneda | null;
  proveedor?: { id: number; nombre: string; tipos: TipoCotizacion[] };
};

type AccesorioAutomatico = {
  id: number;
  id_producto_tubo: number;
  id_producto_accesorio: number;
  formula: FormulaAccesorioAutomatico;
  separacion_maxima_m?: string | number | null;
  activo: boolean;
  producto_accesorio?: Producto;
};

type Proveedor = { id: number; nombre: string; tipos: TipoCotizacion[] };
type Categoria = { id: number; nombre: string; tipos?: TipoCotizacion[] };
type Subcategoria = { id: number; id_categoria: number; nombre: string };
type EstadoCotizacion = "PENDIENTE" | "APROBADA" | "RECHAZADA";

type CotizacionGuardada = {
  id: number;
  titulo: string;
  cliente?: string | null;
  obra?: string | null;
  total_usd: string | number;
  creada_en: string;
  estado?: EstadoCotizacion;
  _count?: { items: number };
};

type Props = {
  saveCotizacion: (event: { preventDefault: () => void }) => Promise<boolean>;
  cotizacionForm: CotizacionForm;
  setCotizacionForm: React.Dispatch<React.SetStateAction<CotizacionForm>>;
  setCotizacionItems: React.Dispatch<React.SetStateAction<CotizacionItem[]>>;
  dolarVenta: number;
  cotizacionProducto: { idProveedor?: string; buscar?: string; idCategoria?: string; idSubcategoria?: string };
  setCotizacionProducto: React.Dispatch<React.SetStateAction<any>>;
  proveedores: Proveedor[];
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  productosCotizacion: Producto[];
  accesoriosAutomaticos: AccesorioAutomatico[];
  cotizacionItems: CotizacionItem[];
  cotizaciones: CotizacionGuardada[];
  cotizacionesFiltradas: CotizacionGuardada[];
  estadoFiltro: EstadoCotizacion | null;
  setEstadoFiltro: (estado: EstadoCotizacion | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  loadCotizaciones: () => void;
  openCotizacion: (id: number) => void;
  clearCotizacionDraft: () => void;
  cotizacionEditId?: number | null;
  cotizacionWizardOpen: boolean;
  setCotizacionWizardOpen: React.Dispatch<React.SetStateAction<boolean>>;
  printCotizacionById: (id: number) => void;
  apiUrl: string;
};

const steps = ["Datos generales", "Items y precios", "Vista previa"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function numberFormat(value: number) {
  return Number(value || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function fieldBase(hasError = false) {
  return classNames(
    "min-h-11 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100",
    hasError ? "border-red-400 ring-4 ring-red-50" : "border-slate-200",
  );
}

function toUsd(value: number, moneda: Moneda, dolarVenta: number) {
  if (moneda === "USD") return value;
  return dolarVenta ? value / dolarVenta : 0;
}

function fromUsd(value: number, moneda: Moneda, dolarVenta: number) {
  if (moneda === "USD") return value;
  return value * (dolarVenta || 0);
}

function formatBase(valueUsd: number, moneda: Moneda, dolarVenta: number) {
  return `${moneda} ${numberFormat(fromUsd(valueUsd, moneda, dolarVenta))}`;
}

function addDays(dateIso: string, days: string) {
  const date = new Date(`${dateIso || todayIso()}T00:00:00`);
  date.setDate(date.getDate() + toNumber(days));
  return date.toISOString().slice(0, 10);
}

function buildQuoteNumber(cotizaciones: CotizacionGuardada[]) {
  const year = new Date().getFullYear();
  const next = String((cotizaciones?.length || 0) + 1).padStart(3, "0");
  return `COT-${year}-${next}`;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="quoteStepper">
      <div className="quoteStepperTrack">
        {steps.map((label, index) => {
          const state = index < currentStep ? "completed" : index === currentStep ? "active" : "pending";
          return (
            <div
              key={label}
              className={`quoteStepperItem ${state}`}
            >
              {index > 0 && (
                <span
                  className={`quoteStepperLine ${index <= currentStep ? "done" : ""}`}
                />
              )}
              <span
                className="quoteStepperCircle"
              >
                {state === "completed" ? <Check size={16} strokeWidth={3} /> : index + 1}
              </span>
              <strong className="quoteStepperLabel" title={label}>{label}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Cliente = { nombre: string; cuit: string; _norm: string };

const CLIENTES_STORAGE_KEY = "clientes_cache";
const CLIENTES_STORAGE_TTL = 30 * 60 * 1000;

function normalizeStr(s: string) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
}

function isTubeProduct(product?: Producto | null) {
  return normalizeStr(String(product?.unidad || "")) === "tubo";
}

function productOptionId(product: Producto) {
  return `${(product as any)._tipo || "PRODUCTO"}:${product.id}`;
}

function accessoryQuantity(formula: FormulaAccesorioAutomatico, meters: number, separacionMaxima?: number | null) {
  if (formula === "PERA") {
    const separacion = toNumber(separacionMaxima);
    if (separacion <= 0) return null;
    return Math.ceil(meters / separacion) + 1;
  }
  if (formula === "SOPORTE") return Math.ceil(meters / 3.5);
  return Math.ceil(meters / 6.4);
}

function loadClientesFromStorage(): Cliente[] | null {
  try {
    const raw = sessionStorage.getItem(CLIENTES_STORAGE_KEY);
    if (!raw) return null;
    const { data, at } = JSON.parse(raw);
    if (Date.now() - at > CLIENTES_STORAGE_TTL) return null;
    return data;
  } catch { return null; }
}

function saveClientesToStorage(data: Cliente[]) {
  try { sessionStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify({ data, at: Date.now() })); }
  catch { /* quota exceeded */ }
}

function ClienteAutocomplete({
  value,
  clientes,
  onSelect,
  onChange,
  error,
}: {
  value: string;
  clientes: Cliente[];
  onSelect: (c: Cliente) => void;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = normalizeStr(value.trim());
    if (!q || q.length < 2) return [];
    return clientes.filter((c) => c._norm.includes(q) || c.cuit.includes(q)).slice(0, 10);
  }, [value, clientes]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        className={fieldBase(Boolean(error))}
        value={value}
        placeholder="Ej: Constructora Aldana S.A."
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul className="clienteAutocompleteList">
          {filtered.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                className="clienteAutocompleteItem"
                onMouseDown={() => { onSelect(c); setOpen(false); }}
              >
                <span className="clienteAutocompleteName">{c.nombre}</span>
                {c.cuit && <span className="clienteAutocompleteCuit">{c.cuit}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Step1Form({
  form,
  setForm,
  errors,
  clientes,
}: {
  form: CotizacionForm;
  setForm: React.Dispatch<React.SetStateAction<CotizacionForm>>;
  errors: Record<string, string>;
  clientes: Cliente[];
}) {
  const update = (field: keyof CotizacionForm, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <section className="grid gap-4">
      <DarkPanel title="Tipo de cotizacion" icon={<FileText size={15} />}>
        <div className="quoteTypeCards">
          {([
            ["EXTINCION", "Extincion", Flame],
            ["DETECCION", "Deteccion", Wrench],
            ["SALA_BOMBAS", "Sala de bombas", Droplets],
          ] as [TipoCotizacion, string, React.ElementType][]).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={`quoteTypeCard ${form.tipo === id ? "active" : ""}`}
              onClick={() => update("tipo", id)}
            >
              <Icon size={17} />
              <strong className="text-xs">{label}</strong>
            </button>
          ))}
        </div>
      </DarkPanel>

      <DarkPanel title="Informacion del proyecto" icon={<Building2 size={15} />}>
        <div className="quoteFormStack">
          <LabeledInput label="Titulo de la cotizacion" required error={errors.titulo}>
            <input className={fieldBase(Boolean(errors.titulo))} value={form.titulo || ""} placeholder="Ej: Instalacion sistema extincion - Planta Norte" onChange={(event) => update("titulo", event.target.value)} />
          </LabeledInput>
          <div className="quoteFormGrid">
            <LabeledInput label="Obra / Proyecto" required error={errors.obra}>
              <input className={fieldBase(Boolean(errors.obra))} value={form.obra || ""} placeholder="Ej: Planta Norte, Edificio Centro" onChange={(event) => update("obra", event.target.value)} />
            </LabeledInput>
            <LabeledInput label="Fecha de emision">
              <input className={fieldBase()} type="date" value={form.fecha_emision || todayIso()} onChange={(event) => update("fecha_emision", event.target.value)} />
            </LabeledInput>
            <LabeledInput label="Validez de la oferta">
              <select className={fieldBase()} value={form.validez_dias || "30"} onChange={(event) => update("validez_dias", event.target.value)}>
                {[15, 30, 45, 60].map((days) => <option key={days} value={days}>{days} dias</option>)}
              </select>
            </LabeledInput>
            <LabeledInput label="Moneda base">
              <select className={fieldBase()} value={form.moneda_base || "USD"} onChange={(event) => update("moneda_base", event.target.value as Moneda)}>
                <option value="USD">USD - Dolar</option>
                <option value="ARS">ARS - Pesos</option>
              </select>
            </LabeledInput>
          </div>
        </div>
      </DarkPanel>

      <DarkPanel title="Cliente" icon={<BriefcaseBusiness size={15} />}>
        <div className="quoteFormGrid">
          <LabeledInput label="Nombre / Razon social" required error={errors.cliente}>
            <ClienteAutocomplete
              value={form.cliente || ""}
              clientes={clientes}
              error={errors.cliente}
              onChange={(v) => update("cliente", v)}
              onSelect={(c) => setForm((f) => ({ ...f, cliente: c.nombre, cuit_cliente: c.cuit }))}
            />
          </LabeledInput>
          <LabeledInput label="Atencion a (contacto)">
            <input className={fieldBase()} value={form.contacto_cliente || ""} placeholder="Ej: Ing. Martinez" onChange={(event) => update("contacto_cliente", event.target.value)} />
          </LabeledInput>
          <LabeledInput label="CUIT / NIT">
            <input className={fieldBase()} value={form.cuit_cliente || ""} placeholder="30-12345678-9" onChange={(event) => update("cuit_cliente", event.target.value)} />
          </LabeledInput>
          <LabeledInput label="Telefono de obra">
              <input className={fieldBase()} type="tel" value={form.telefono_obra || ""} placeholder="Ej: +54 11 1234-5678" onChange={(event) => update("telefono_obra", event.target.value)} />
          </LabeledInput>
          <LabeledInput label="Email">
            <input className={fieldBase()} type="email" value={form.email_cliente || ""} placeholder="contacto@empresa.com" onChange={(event) => update("email_cliente", event.target.value)} />
          </LabeledInput>
        </div>
      </DarkPanel>

      <DarkPanel title="Condiciones y observaciones" icon={<ClipboardList size={15} />}>
        <div className="quoteFormGrid">
          <LabeledInput label="Condicion de pago">
            <select className={fieldBase()} value={form.forma_pago || "Contado"} onChange={(event) => update("forma_pago", event.target.value)}>
              <option>Contado</option>
              <option>50% anticipo / 50% contra entrega</option>
              <option>Cuenta corriente</option>
              <option>A convenir</option>
            </select>
          </LabeledInput>
          <LabeledInput label="Plazo de entrega / ejecucion">
            <input className={fieldBase()} value={form.plazo_entrega || ""} placeholder="Ej: 45 dias habiles" onChange={(event) => update("plazo_entrega", event.target.value)} />
          </LabeledInput>
        </div>
        <LabeledInput label="Observaciones">
          <textarea className={classNames(fieldBase(), "mt-1 min-h-24 resize-y")} value={form.observaciones || ""} onChange={(event) => update("observaciones", event.target.value)} />
        </LabeledInput>
      </DarkPanel>
    </section>
  );
}

function DarkPanel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="quoteSectionTitle">
        <span className="quoteSectionIcon">{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function LabeledInput({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="quoteField">
      <span>{label}{required ? " *" : ""}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

function Step2Items({
  form,
  setForm,
  proveedores,
  categorias,
  subcategorias,
  productosCotizacion,
  accesoriosAutomaticos,
  cotizacionProducto,
  setCotizacionProducto,
  items,
  setItems,
  dolarVenta,
  totals,
}: {
  form: CotizacionForm;
  setForm: React.Dispatch<React.SetStateAction<CotizacionForm>>;
  proveedores: Proveedor[];
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  productosCotizacion: Producto[];
  accesoriosAutomaticos: AccesorioAutomatico[];
  cotizacionProducto: { idProveedor?: string; buscar?: string; idCategoria?: string; idSubcategoria?: string };
  setCotizacionProducto: React.Dispatch<React.SetStateAction<any>>;
  items: CotizacionItem[];
  setItems: React.Dispatch<React.SetStateAction<CotizacionItem[]>>;
  dolarVenta: number;
  totals: Totals;
}) {
  const [activeTab, setActiveTab] = useState<"productos" | "manual" | "mano">("productos");
  const [error, setError] = useState("");
  const [productoForm, setProductoForm] = useState({ idProducto: "", cantidad: "1", precio_unitario: "", moneda: "USD" as Moneda });
  const [manualForm, setManualForm] = useState({ descripcion: "", cantidad: "1", unidad: "gl", precio_unitario: "", moneda: "USD" as Moneda });
  const [manoForm, setManoForm] = useState({ descripcion: "Mano de obra", personas: "1", dias: "1", precio_unitario: "", moneda: "USD" as Moneda });

  const visibleProductosCotizacion = (productosCotizacion as any[]).slice(0, 50);
  const selectedProduct = productosCotizacion.find((item) => productOptionId(item) === productoForm.idProducto);
  const selectedIsTube = isTubeProduct(selectedProduct);

  function pushItem(item: CotizacionItem) {
    setItems((current) => [...current, item]);
    setError("");
  }

  function automaticAccessoriesFor(tubeItems: CotizacionItem[]) {
    const generated: CotizacionItem[] = [];
    for (const tube of tubeItems) {
      const meters = toNumber(tube.metros_requeridos);
      if (!tube.id_producto_proveedor || meters <= 0 || normalizeStr(tube.unidad) !== "tubo") continue;
      const configs = accesoriosAutomaticos.filter((config) => config.activo && String(config.id_producto_tubo) === String(tube.id_producto_proveedor));
      for (const config of configs) {
        const accessory = config.producto_accesorio;
        if (!accessory) return { error: "Hay un accesorio automatico sin producto configurado", items: [] };
        const accessoryPrice = toNumber(accessory.precio_actual);
        const accessoryCurrency = accessory.moneda_actual || "USD";
        if (!accessoryPrice || !accessory.moneda_actual) return { error: `El accesorio ${accessory.nombre_producto_proveedor} no tiene precio actual`, items: [] };
        if (accessoryCurrency === "ARS" && !dolarVenta) return { error: "No hay cotizacion de dolar disponible para convertir ARS", items: [] };
        const accessoryQty = accessoryQuantity(config.formula, meters, toNumber(config.separacion_maxima_m));
        if (!accessoryQty || accessoryQty <= 0) return { error: config.formula === "PERA" ? "La formula PERA requiere una separacion maxima mayor a cero" : `No se pudo calcular ${config.formula}`, items: [] };
        generated.push({
          localId: crypto.randomUUID(),
          id_producto_proveedor: accessory.id,
          tipo: "PRODUCTO",
          grupo: "MATERIAL",
          descripcion: `${accessory.sku_producto_proveedor} - ${accessory.nombre_producto_proveedor} | Automatico ${config.formula} para ${numberFormat(meters)} m de tubo`,
          cantidad: accessoryQty,
          unidad: accessory.unidad || "",
          precio_unitario: accessoryPrice,
          moneda: accessoryCurrency,
          total_usd: toUsd(accessoryQty * accessoryPrice, accessoryCurrency, dolarVenta),
          generado_automaticamente: true,
          formula_automatica: config.formula,
          accesorio_origen_local_id: tube.localId,
        });
      }
    }
    return { error: "", items: generated };
  }

  function removeItem(item: CotizacionItem) {
    if (item.generado_automaticamente) {
      setItems((current) => current.filter((row) => row.localId !== item.localId));
      return;
    }
    setItems((current) => {
      const manualItems = current.filter((row) => row.localId !== item.localId && !row.generado_automaticamente);
      const { error: nextError, items: generatedItems } = automaticAccessoriesFor(manualItems);
      if (nextError) setError(nextError);
      else setError("");
      return [...manualItems, ...generatedItems];
    });
  }

  function addProducto() {
    if (!selectedProduct) return setError("Selecciona un producto del catalogo");
    const cantidad = toNumber(productoForm.cantidad);
    if (cantidad <= 0) return setError("La cantidad debe ser mayor a cero");

    const product = selectedProduct as any;

    // Handle composite product — expand into individual items
    if (product._tipo === "COMPUESTO") {
      const compItems: any[] = product.items || [];
      if (!compItems.length) return setError("El compuesto no tiene items configurados");

      const newItems: CotizacionItem[] = [];
      for (const ci of compItems) {
        const cantidadFinal = toNumber(ci.cantidad) * cantidad;
        if (ci.tipo === "PRODUCTO" && ci.producto_proveedor) {
          const prod = ci.producto_proveedor;
          const precio = toNumber(prod.precio_actual);
          const moneda = (prod.moneda_actual || "USD") as Moneda;
          if (!precio) continue;
          if (moneda === "ARS" && !dolarVenta) return setError("No hay cotizacion de dolar disponible para convertir ARS");
          newItems.push({
            localId: crypto.randomUUID(),
            id_producto_proveedor: prod.id,
            tipo: "PRODUCTO",
            grupo: "MATERIAL",
            descripcion: `${prod.sku_producto_proveedor} - ${prod.nombre_producto_proveedor}`,
            cantidad: cantidadFinal,
            unidad: ci.unidad || prod.unidad || "",
            precio_unitario: precio,
            moneda,
            total_usd: toUsd(cantidadFinal * precio, moneda, dolarVenta),
          });
        } else if (ci.tipo === "MANUAL") {
          const precio = toNumber(ci.precio_unitario);
          const moneda = (ci.moneda || "USD") as Moneda;
          if (moneda === "ARS" && !dolarVenta) return setError("No hay cotizacion de dolar disponible para convertir ARS");
          newItems.push({
            localId: crypto.randomUUID(),
            id_producto_proveedor: null,
            tipo: "MANUAL",
            grupo: "MATERIAL",
            descripcion: ci.descripcion,
            cantidad: cantidadFinal,
            unidad: ci.unidad || "",
            precio_unitario: precio,
            moneda,
            total_usd: toUsd(cantidadFinal * precio, moneda, dolarVenta),
          });
        }
      }
      if (!newItems.length) return setError("No se pudieron agregar items del compuesto (verifique que tengan precio)");
      newItems.forEach(pushItem);
      setProductoForm({ idProducto: "", cantidad: "1", precio_unitario: "", moneda: "USD" });
      setCotizacionProducto((current: any) => ({ ...current, buscar: "" }));
      return;
    }

    // Regular product
    const precio = toNumber(productoForm.precio_unitario || selectedProduct.precio_actual);
    const moneda = (productoForm.moneda || selectedProduct.moneda_actual || "USD") as Moneda;
    if (precio < 0) return setError("Precio unitario invalido");
    if (moneda === "ARS" && !dolarVenta) return setError("No hay cotizacion de dolar disponible para convertir ARS");
    const metrosRequeridos = selectedIsTube ? cantidad : null;
    const longitudTubo = toNumber(selectedProduct.cantidad_por_unidad_compra);
    const cantidadCotizada = selectedIsTube ? Math.ceil(cantidad / longitudTubo) : cantidad;
    if (selectedIsTube && longitudTubo <= 0) return setError("El tubo no tiene longitud comercial configurada");
    const metrosCotizados = selectedIsTube ? cantidadCotizada * longitudTubo : cantidad;

    const localId = crypto.randomUUID();
    const newItems: CotizacionItem[] = [{
      localId,
      id_producto_proveedor: selectedProduct.id,
      tipo: "PRODUCTO",
      grupo: "MATERIAL",
      descripcion: selectedIsTube
        ? `${selectedProduct.sku_producto_proveedor} - ${selectedProduct.nombre_producto_proveedor} | ${numberFormat(cantidad)} m requeridos (${numberFormat(longitudTubo)} m por tubo)`
        : `${selectedProduct.sku_producto_proveedor} - ${selectedProduct.nombre_producto_proveedor}`,
      cantidad: cantidadCotizada,
      unidad: selectedProduct.unidad || "",
      precio_unitario: precio,
      moneda,
      total_usd: toUsd(cantidadCotizada * precio, moneda, dolarVenta),
      metros_requeridos: metrosRequeridos,
    }];

    if (selectedIsTube) {
      const configs = accesoriosAutomaticos.filter((config) => config.activo && String(config.id_producto_tubo) === String(selectedProduct.id));
      for (const config of configs) {
        const accessory = config.producto_accesorio;
        if (!accessory) return setError("Hay un accesorio automatico sin producto configurado");
        const accessoryPrice = toNumber(accessory.precio_actual);
        const accessoryCurrency = accessory.moneda_actual || "USD";
        if (!accessoryPrice || !accessory.moneda_actual) return setError(`El accesorio ${accessory.nombre_producto_proveedor} no tiene precio actual`);
        if (accessoryCurrency === "ARS" && !dolarVenta) return setError("No hay cotizacion de dolar disponible para convertir ARS");
        const accessoryQty = accessoryQuantity(config.formula, metrosCotizados, toNumber(config.separacion_maxima_m));
        if (!accessoryQty || accessoryQty <= 0) return setError(config.formula === "PERA" ? "La formula PERA requiere una separacion maxima mayor a cero" : `No se pudo calcular ${config.formula}`);
        newItems.push({
          localId: crypto.randomUUID(),
          id_producto_proveedor: accessory.id,
          tipo: "PRODUCTO",
          grupo: "MATERIAL",
          descripcion: `${accessory.sku_producto_proveedor} - ${accessory.nombre_producto_proveedor} | Automatico ${config.formula} para ${numberFormat(metrosCotizados)} m cotizados`,
          cantidad: accessoryQty,
          unidad: accessory.unidad || "",
          precio_unitario: accessoryPrice,
          moneda: accessoryCurrency,
          total_usd: toUsd(accessoryQty * accessoryPrice, accessoryCurrency, dolarVenta),
          generado_automaticamente: true,
          formula_automatica: config.formula,
          accesorio_origen_local_id: localId,
        });
      }
    }

    setItems((current) => [...current, ...newItems]);
    setError("");
    setProductoForm({ idProducto: "", cantidad: "1", precio_unitario: "", moneda: "USD" });
    setCotizacionProducto((current: any) => ({ ...current, buscar: "" }));
  }

  function addManual() {
    const cantidad = toNumber(manualForm.cantidad);
    const precio = toNumber(manualForm.precio_unitario);
    if (!manualForm.descripcion.trim()) return setError("Carga una descripcion");
    if (cantidad <= 0 || precio < 0) return setError("Cantidad y precio unitario son requeridos");
    if (manualForm.moneda === "ARS" && !dolarVenta) return setError("No hay cotizacion de dolar disponible para convertir ARS");

    pushItem({
      localId: crypto.randomUUID(),
      id_producto_proveedor: null,
      tipo: "MANUAL",
      grupo: "MATERIAL",
      descripcion: manualForm.descripcion,
      cantidad,
      unidad: manualForm.unidad,
      precio_unitario: precio,
      moneda: manualForm.moneda,
      total_usd: toUsd(cantidad * precio, manualForm.moneda, dolarVenta),
    });
    setManualForm({ descripcion: "", cantidad: "1", unidad: "gl", precio_unitario: "", moneda: "USD" });
  }

  function addManoObra() {
    const personas = toNumber(manoForm.personas);
    const dias = toNumber(manoForm.dias);
    const precio = toNumber(manoForm.precio_unitario);
    if (!manoForm.descripcion.trim()) return setError("Carga una descripcion del trabajo");
    if (personas <= 0 || dias <= 0 || precio < 0) return setError("Personas, dias y precio son requeridos");
    if (manoForm.moneda === "ARS" && !dolarVenta) return setError("No hay cotizacion de dolar disponible para convertir ARS");

    pushItem({
      localId: crypto.randomUUID(),
      id_producto_proveedor: null,
      tipo: "MANUAL",
      grupo: "MANO_OBRA",
      descripcion: manoForm.descripcion,
      cantidad: personas * dias,
      unidad: "jornal",
      precio_unitario: precio,
      moneda: manoForm.moneda,
      total_usd: toUsd(personas * dias * precio, manoForm.moneda, dolarVenta),
    });
    setManoForm({ descripcion: "Mano de obra", personas: "1", dias: "1", precio_unitario: "", moneda: "USD" });
  }

  return (
    <section className="quoteItemsLayout">
      <div className="quoteStepPanel">
        <div className="quoteStepHeader">
          <p>Paso 2</p>
          <h2>Items y precios</h2>
        </div>
        <div className="quoteStepBody">
        <div className="quoteItemTabs">
          {([
            ["productos", "Productos", PackageSearch],
            ["manual", "Item manual", ClipboardList],
            ["mano", "Mano de obra", Hammer],
          ] as [string, string, React.ElementType][]).map(([id, label, Icon]) => (
            <button key={id as string} type="button" className={`quoteItemTab ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id as any)}>
              {typeof Icon !== "string" && <Icon size={16} />}
              {label}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div>}

        {activeTab === "productos" && (
          <div className="quoteAddPanel">
            <div className="quotePanelTitle"><PackageSearch size={15} /><span>Agregar producto del catalogo</span></div>

            {/* Category nav */}
            {(() => {
              const categoriasFiltradas = categorias.filter(
                (cat) => !cat.tipos?.length || cat.tipos.includes(form.tipo)
              );
              const subcategoriasDisponibles = subcategorias.filter((s) =>
                String(s.id_categoria) === String(cotizacionProducto.idCategoria)
              );
              return (
                <div className="quoteCategoryNav">
                  <div className="quoteCategoryRow">
                    <button
                      type="button"
                      className={`quoteCategoryChip ${!cotizacionProducto.idCategoria ? "active" : ""}`}
                      onClick={() => setCotizacionProducto((c: any) => ({ ...c, idCategoria: "", idSubcategoria: "", buscar: "" }))}
                    >
                      Todas
                    </button>
                    {categoriasFiltradas.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`quoteCategoryChip ${String(cotizacionProducto.idCategoria) === String(cat.id) ? "active" : ""}`}
                        onClick={() => setCotizacionProducto((c: any) => ({ ...c, idCategoria: String(cat.id), idSubcategoria: "", buscar: "" }))}
                      >
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                  {cotizacionProducto.idCategoria && subcategoriasDisponibles.length > 0 && (
                    <div className="quoteCategoryRow quoteCategorySubrow">
                      <button
                        type="button"
                        className={`quoteCategoryChip sub ${!cotizacionProducto.idSubcategoria ? "active" : ""}`}
                        onClick={() => setCotizacionProducto((c: any) => ({ ...c, idSubcategoria: "", buscar: "" }))}
                      >
                        Todas
                      </button>
                      {subcategoriasDisponibles.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          className={`quoteCategoryChip sub ${String(cotizacionProducto.idSubcategoria) === String(sub.id) ? "active" : ""}`}
                          onClick={() => setCotizacionProducto((c: any) => ({ ...c, idSubcategoria: String(sub.id), buscar: "" }))}
                        >
                          {sub.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Search + quantity row */}
            <div className="quoteProductFormGrid">
              <LabeledInput label="Buscar en categoria">
                <input className={fieldBase()} value={cotizacionProducto.buscar || ""} placeholder="SKU, nombre o proveedor..." onChange={(event) => setCotizacionProducto((current: any) => ({ ...current, buscar: event.target.value }))} />
              </LabeledInput>
              <LabeledInput label={selectedIsTube ? "Metros requeridos" : "Cantidad"}>
                <input className={fieldBase()} type="number" min="0" value={productoForm.cantidad} onChange={(event) => setProductoForm((current) => ({ ...current, cantidad: event.target.value }))} />
                {selectedIsTube && <span className="text-xs font-bold text-slate-500">Se cotiza por tubos comerciales y agrega accesorios configurados.</span>}
              </LabeledInput>
              <LabeledInput label="Precio unitario">
                <input className={fieldBase()} type="number" min="0" value={productoForm.precio_unitario} onChange={(event) => setProductoForm((current) => ({ ...current, precio_unitario: event.target.value }))} disabled />
              </LabeledInput>
              <LabeledInput label="Moneda">
                <select className={fieldBase()} value={productoForm.moneda} onChange={(event) => setProductoForm((current) => ({ ...current, moneda: event.target.value as Moneda }))} disabled>
                  <option>USD</option>
                  <option>ARS</option>
                </select>
              </LabeledInput>
              <div className="quoteAddButtonSlot">
                <button type="button" className="quoteBtn quoteBtnPrimary" onClick={addProducto}><Plus size={16} />Agregar</button>
              </div>
            </div>

            <div className="quoteProductResults">
              {visibleProductosCotizacion.map((item) => {
                const isCompuesto = item._tipo === "COMPUESTO";
                return (
                  <button
                    key={productOptionId(item)}
                    type="button"
                    className={`quoteProductResult ${productoForm.idProducto === productOptionId(item) ? "selected" : ""}`}
                    onClick={() => {
                      setProductoForm({
                        idProducto: productOptionId(item),
                        cantidad: productoForm.cantidad,
                        precio_unitario: isCompuesto ? "" : String(item.precio_actual || ""),
                        moneda: isCompuesto ? "USD" : (item.moneda_actual || "USD"),
                      });
                    }}
                  >
                    {isCompuesto ? (
                      <>
                        <span className="quoteProductSku quoteProductKitBadge">Kit</span>
                        <span className="quoteProductName">{item.nombre}</span>
                        <span className="quoteProductMeta">{item.items?.length || 0} items · se expanden al agregar</span>
                      </>
                    ) : (
                      <>
                        <span className="quoteProductSku">{item.sku_producto_proveedor}</span>
                        <span className="quoteProductName">{item.nombre_producto_proveedor}</span>
                        <span className="quoteProductMeta">{item.proveedor?.nombre || "Sin proveedor"} · {formatMoney(item.precio_actual, item.moneda_actual || "USD")}</span>
                      </>
                    )}
                  </button>
                );
              })}
              {productosCotizacion.length > visibleProductosCotizacion.length && (
                <p className="quoteEmptyText">Mostrando {visibleProductosCotizacion.length} de {productosCotizacion.length} resultados. Refina la busqueda para ver menos.</p>
              )}
              {!productosCotizacion.length && <p className="quoteEmptyText">Sin productos para la busqueda</p>}
            </div>
          </div>
        )}

        {activeTab === "manual" && (
          <div className="quoteAddPanel">
          <div className="quotePanelTitle"><ClipboardList size={15} /><span>Agregar item manual</span></div>
          <div className="quoteProductFormGrid">
            <LabeledInput label="Descripcion">
              <input className={fieldBase()} value={manualForm.descripcion} placeholder="Flete, alquiler, ajuste" onChange={(event) => setManualForm((current) => ({ ...current, descripcion: event.target.value }))} />
            </LabeledInput>
            <LabeledInput label="Cantidad">
              <input className={fieldBase()} type="number" min="0" value={manualForm.cantidad} onChange={(event) => setManualForm((current) => ({ ...current, cantidad: event.target.value }))} />
            </LabeledInput>
            <LabeledInput label="Unidad">
              <input className={fieldBase()} value={manualForm.unidad} placeholder="gl, m, un" onChange={(event) => setManualForm((current) => ({ ...current, unidad: event.target.value }))} />
            </LabeledInput>
            <LabeledInput label="Precio unitario">
              <input className={fieldBase()} type="number" min="0" value={manualForm.precio_unitario} onChange={(event) => setManualForm((current) => ({ ...current, precio_unitario: event.target.value }))} />
            </LabeledInput>
            <LabeledInput label="Moneda">
              <select className={fieldBase()} value={manualForm.moneda} onChange={(event) => setManualForm((current) => ({ ...current, moneda: event.target.value as Moneda }))}>
                <option>USD</option>
                <option>ARS</option>
              </select>
            </LabeledInput>
            <div className="quoteAddButtonSlot">
              <button type="button" className="quoteBtn quoteBtnPrimary" onClick={addManual}><Plus size={16} />Agregar</button>
            </div>
          </div>
          </div>
        )}

        {activeTab === "mano" && (
          <div className="quoteAddPanel">
          <div className="quotePanelTitle"><Hammer size={15} /><span>Agregar mano de obra</span></div>
          <div className="quoteProductFormGrid">
            <LabeledInput label="Descripcion del trabajo">
              <input className={fieldBase()} value={manoForm.descripcion} onChange={(event) => setManoForm((current) => ({ ...current, descripcion: event.target.value }))} />
            </LabeledInput>
            <LabeledInput label="Personas">
              <input className={fieldBase()} type="number" min="0" value={manoForm.personas} onChange={(event) => setManoForm((current) => ({ ...current, personas: event.target.value }))} />
            </LabeledInput>
            <LabeledInput label="Dias">
              <input className={fieldBase()} type="number" min="0" value={manoForm.dias} onChange={(event) => setManoForm((current) => ({ ...current, dias: event.target.value }))} />
            </LabeledInput>
            <LabeledInput label="Precio por persona/dia">
              <input className={fieldBase()} type="number" min="0" value={manoForm.precio_unitario} onChange={(event) => setManoForm((current) => ({ ...current, precio_unitario: event.target.value }))} />
            </LabeledInput>
            <LabeledInput label="Moneda">
              <select className={fieldBase()} value={manoForm.moneda} onChange={(event) => setManoForm((current) => ({ ...current, moneda: event.target.value as Moneda }))}>
                <option>USD</option>
                <option>ARS</option>
              </select>
            </LabeledInput>
            <div className="quoteAddButtonSlot">
              <button type="button" className="quoteBtn quoteBtnPrimary" onClick={addManoObra}><Plus size={16} />Agregar</button>
            </div>
          </div>
          </div>
        )}

        <div className="quoteItemsTableWrap">
        <ItemsTable items={items} removeItem={removeItem} monedaBase={form.moneda_base || "USD"} dolarVenta={dolarVenta} />
        </div>
        </div>
      </div>

      <TotalsPanel form={form} setForm={setForm} totals={totals} dolarVenta={dolarVenta} />
    </section>
  );
}

type Totals = {
  materialesUsd: number;
  manoObraUsd: number;
  costoDirectoUsd: number;
  utilidadUsd: number;
  costosVariosUsd: number;
  totalUsd: number;
};

function ItemsTable({
  items,
  removeItem,
  monedaBase,
  dolarVenta,
}: {
  items: CotizacionItem[];
  removeItem: (item: CotizacionItem) => void;
  monedaBase: Moneda;
  dolarVenta: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <strong className="text-sm text-slate-900">Items cargados</strong>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{items.length} items</span>
      </div>
      <div className="overflow-auto">
      <table className="!min-w-[900px]">
        <thead className="bg-white">
          <tr>
            <th>Tipo</th>
            <th>Descripcion</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Precio unitario</th>
            <th>Moneda</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.localId}>
              <td>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {item.grupo === "MANO_OBRA" ? <Hammer size={14} /> : item.tipo === "PRODUCTO" ? <PackageSearch size={14} /> : <ClipboardList size={14} />}
                  {item.generado_automaticamente ? "Automatico" : item.grupo === "MANO_OBRA" ? "Mano de obra" : item.tipo === "PRODUCTO" ? "Producto" : "Manual"}
                </span>
              </td>
              <td>{item.descripcion}{item.metros_requeridos ? <div className="text-xs font-bold text-slate-500">Metros requeridos: {numberFormat(item.metros_requeridos)} m</div> : null}</td>
              <td>{numberFormat(item.cantidad)}</td>
              <td>{item.unidad || "-"}</td>
              <td>{formatMoney(item.precio_unitario, item.moneda)}</td>
              <td>{item.moneda}</td>
              <td>{formatBase(item.total_usd, monedaBase, dolarVenta)}</td>
              <td className="rowActions">
                <button type="button" className="inline-flex items-center gap-1 !rounded-lg !bg-red-50 !px-3 !py-2 !text-red-700 hover:!bg-red-100" onClick={() => removeItem(item)}><Trash2 size={14} />Eliminar</button>
              </td>
            </tr>
          ))}
          {!items.length && <tr><td colSpan={8}>Sin items cargados</td></tr>}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function TotalsPanel({
  form,
  setForm,
  totals,
  dolarVenta,
}: {
  form: CotizacionForm;
  setForm: React.Dispatch<React.SetStateAction<CotizacionForm>>;
  totals: Totals;
  dolarVenta: number;
}) {
  const monedaBase = form.moneda_base || "USD";
  return (
    <aside className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-4">
      <div className="bg-sky-900 px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <BadgeDollarSign size={20} />
          <h2 className="!m-0 text-lg font-extrabold">Resumen</h2>
        </div>
      </div>
      <div className="grid gap-4 p-5">
        <SummaryRow label="Costo directo de obra" value={formatBase(totals.costoDirectoUsd, monedaBase, dolarVenta)} />
        <LabeledInput label="Utilidad %">
          <input className={fieldBase()} type="number" min="0" value={form.porcentaje_utilidad || "0"} onChange={(event) => setForm((current) => ({ ...current, porcentaje_utilidad: event.target.value }))} />
        </LabeledInput>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
          <input type="checkbox" checked={Boolean(form.aplica_costos_varios)} onChange={(event) => setForm((current) => ({ ...current, aplica_costos_varios: event.target.checked, porcentaje_costos_varios: "5" }))} />
          Aplicar costos varios (5%)
        </label>
        <SummaryRow label="Utilidad" value={formatBase(totals.utilidadUsd, monedaBase, dolarVenta)} />
        <SummaryRow label="Costos varios" value={formatBase(totals.costosVariosUsd, monedaBase, dolarVenta)} />
        <div className="rounded-xl bg-slate-950 p-4 text-white">
          <span className="block text-sm font-bold opacity-80">Total cotizacion</span>
          <strong className="text-2xl">{formatBase(totals.totalUsd, monedaBase, dolarVenta)}</strong>
        </div>
        <small className="font-bold text-slate-500">Dolar referencia: {dolarVenta ? formatMoney(dolarVenta, "ARS") : "sin cotizacion"}</small>
      </div>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <strong className="text-right text-slate-900">{value}</strong>
    </div>
  );
}

function Step3Preview({
  form,
  items,
  totals,
  quoteNumber,
  dolarVenta,
}: {
  form: CotizacionForm;
  items: CotizacionItem[];
  totals: Totals;
  quoteNumber: string;
  dolarVenta: number;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: previewRef, documentTitle: quoteNumber });

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
      <PreviewDocument ref={previewRef} form={form} items={items} totals={totals} quoteNumber={quoteNumber} dolarVenta={dolarVenta} />
      <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-4">
        <div className="mb-4 rounded-xl bg-slate-50 p-3">
          <p className="!m-0 text-xs font-extrabold uppercase text-slate-500">Documento</p>
          <strong className="block text-slate-950">{quoteNumber}</strong>
        </div>
        <button type="button" className="mb-2 inline-flex w-full items-center justify-center gap-2 !rounded-lg !bg-transparent !py-2.5 !text-slate-700 ring-1 ring-slate-200 hover:!bg-slate-50"><Wrench size={16} />Mejorar texto</button>
        <button type="button" className="inline-flex w-full items-center justify-center gap-2 !rounded-lg !bg-sky-900 !py-2.5 !text-white hover:!bg-sky-800" onClick={handlePrint}><Printer size={16} />Exportar PDF</button>
      </aside>
    </section>
  );
}

const PreviewDocument = React.forwardRef<HTMLDivElement, {
  form: CotizacionForm;
  items: CotizacionItem[];
  totals: Totals;
  quoteNumber: string;
  dolarVenta: number;
}>(function PreviewDocument({ form, items, totals, quoteNumber, dolarVenta }, ref) {
  const materiales = items.filter((item) => item.grupo !== "MANO_OBRA");
  const manoObra = items.filter((item) => item.grupo === "MANO_OBRA");
  const monedaBase = form.moneda_base || "USD";
  const fechaEmision = form.fecha_emision || todayIso();
  const fechaValidez = addDays(fechaEmision, form.validez_dias || "30");

  return (
    <article ref={ref} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-6 bg-slate-950 p-8 text-white ">
        <div >
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white/10"><Building2 size={24} /></div>
          <h1 className="!m-0 text-2xl font-extrabold">Pastorino Seguridad</h1>
          <p className="!m-0 mt-1 text-sm text-slate-300">Cotizacion tecnica comercial</p>
        </div>
        <div className="rounded-xl bg-white/10 p-4 text-right text-sm">
          <strong className="block text-lg">{quoteNumber}</strong>
          <span className="block">Fecha: {formatDate(fechaEmision)}</span>
          <span className="block">Validez: {formatDate(fechaValidez)}</span>
          <span className="block">Tipo: {form.tipo === "DETECCION" ? "Deteccion" : "Extincion"}</span>
        </div>
      </header>

      <div className="p-8">
      <section className="grid gap-4 md:grid-cols-2">
        <InfoBlock title="Ofertante" rows={[
          ["Empresa", "Pastorino Seguridad"],
          ["Condicion de pago", "A convenir"],
          ["Plazo de entrega", "Segun disponibilidad y avance de obra"],
        ]} />
        <InfoBlock title="Cliente" rows={[
          ["Razon social", form.cliente || "-"],
          ["Atencion a", form.contacto_cliente || "-"],
          ["CUIT / NIT", form.cuit_cliente || "-"],
          ["Email", form.email_cliente || "-"],
        ]} />
      </section>

      <section className="mt-6">
        <h2 className="!m-0 text-xl font-extrabold text-slate-950">{form.titulo || "Cotizacion sin titulo"}</h2>
        <p className="!m-0 mt-1 text-sm font-bold text-slate-600">Obra / Proyecto: {form.obra || "-"}</p>
      </section>

      <PreviewItemsSection title="Materiales y equipos" items={materiales} monedaBase={monedaBase} dolarVenta={dolarVenta} />
      <PreviewItemsSection title="Mano de obra" items={manoObra} monedaBase={monedaBase} dolarVenta={dolarVenta} />

      <section className="mt-6 ml-auto w-full max-w-md overflow-hidden rounded-xl border border-slate-200">
        <SummaryRow label="Subtotal materiales" value={formatBase(totals.materialesUsd, monedaBase, dolarVenta)} />
        <SummaryRow label="Subtotal mano de obra" value={formatBase(totals.manoObraUsd, monedaBase, dolarVenta)} />
        <SummaryRow label="Costos varios" value={formatBase(totals.costosVariosUsd, monedaBase, dolarVenta)} />
        <SummaryRow label={`Utilidad ${numberFormat(toNumber(form.porcentaje_utilidad || 0))}%`} value={formatBase(totals.utilidadUsd, monedaBase, dolarVenta)} />
        <div className="flex items-center justify-between gap-4 bg-sky-900 p-4 text-white">
          <strong>Total final</strong>
          <strong className="text-lg">{formatBase(totals.totalUsd, monedaBase, dolarVenta)} +IVA</strong>
        </div>
      </section>

      <footer className="mt-8 border-t border-slate-200 pt-5">
        <div className="grid gap-3 text-sm text-slate-700">
          <p className="!m-0"><strong>Condicion de pago:</strong> {form.forma_pago || "A convenir"}</p>
          <p className="!m-0"><strong>Plazo de entrega:</strong> {form.plazo_entrega || "Sujeto a disponibilidad y coordinacion de obra"}</p>
          <p className="!m-0"><strong>Observaciones:</strong> {form.observaciones || "-"}</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <Signature label="Ofertante" />
          <Signature label="Cliente" />
        </div>
      </footer>
      </div>
    </article>
  );
});

function InfoBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="!m-0 mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-600">{title}</h3>
      <div className="grid gap-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[120px_1fr] gap-3">
            <strong className="text-slate-500">{label}</strong>
            <span className="font-semibold text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewItemsSection({ title, items, monedaBase, dolarVenta }: { title: string; items: CotizacionItem[]; monedaBase: Moneda; dolarVenta: number }) {
  return (
    <section className="mt-6">
      <h3 className="!mb-2 text-base font-extrabold text-slate-900">{title}</h3>
      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="!min-w-[760px]">
          <thead className="bg-slate-50">
            <tr><th>Descripcion</th><th>Cantidad</th><th>Unidad</th><th>Precio unitario</th><th>Total</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.localId}>
                <td>{item.descripcion}</td>
                <td>{numberFormat(item.cantidad)}</td>
                <td>{item.unidad || "-"}</td>
                <td>{formatMoney(item.precio_unitario, item.moneda)}</td>
                <td>{formatBase(item.total_usd, monedaBase, dolarVenta)}</td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5}>Sin items</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div className="border-t border-slate-400 pt-2 text-center text-sm font-bold text-slate-700">
      Firma {label}
    </div>
  );
}

const STATUS_STYLES: Record<EstadoCotizacion, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  APROBADA: "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
};

function StatusBadge({ estado }: { estado?: EstadoCotizacion }) {
  if (!estado) return null;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[estado] ?? "bg-slate-100 text-slate-600"}`}>
      {estado}
    </span>
  );
}

export function CotizacionesTab({
  saveCotizacion,
  cotizacionForm,
  setCotizacionForm,
  setCotizacionItems,
  dolarVenta,
  cotizacionProducto,
  setCotizacionProducto,
  proveedores,
  categorias,
  subcategorias,
  productosCotizacion,
  accesoriosAutomaticos,
  cotizacionItems,
  cotizaciones,
  cotizacionesFiltradas,
  estadoFiltro,
  setEstadoFiltro,
  searchQuery,
  setSearchQuery,
  loadCotizaciones,
  openCotizacion,
  clearCotizacionDraft,
  cotizacionEditId,
  cotizacionWizardOpen,
  setCotizacionWizardOpen,
  printCotizacionById,
  apiUrl,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    if (!cotizacionWizardOpen || clientes.length > 0) return;
    const cached = loadClientesFromStorage();
    if (cached) { setClientes(cached); return; }
    fetch(`${apiUrl}/clientes`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const normalized = data.map((c: { nombre: string; cuit: string }) => ({
          ...c,
          _norm: normalizeStr(c.nombre),
        }));
        setClientes(normalized);
        saveClientesToStorage(normalized);
      })
      .catch(() => {});
  }, [cotizacionWizardOpen]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const form = {
    ...emptyCotizacionForm,
    ...cotizacionForm,
    fecha_emision: cotizacionForm.fecha_emision || todayIso(),
    validez_dias: cotizacionForm.validez_dias || "30",
    moneda_base: cotizacionForm.moneda_base || "USD",
    porcentaje_costos_varios: "5",
  } as CotizacionForm;

  const totals = useMemo<Totals>(() => {
    const materialesUsd = cotizacionItems.filter((item) => item.grupo !== "MANO_OBRA").reduce((total, item) => total + toNumber(item.total_usd), 0);
    const manoObraUsd = cotizacionItems.filter((item) => item.grupo === "MANO_OBRA").reduce((total, item) => total + toNumber(item.total_usd), 0);
    const costoDirectoUsd = materialesUsd + manoObraUsd;
    const utilidadUsd = costoDirectoUsd * (toNumber(form.porcentaje_utilidad) / 100);
    const costosVariosUsd = form.aplica_costos_varios ? costoDirectoUsd * 0.05 : 0;
    return {
      materialesUsd,
      manoObraUsd,
      costoDirectoUsd,
      utilidadUsd,
      costosVariosUsd,
      totalUsd: costoDirectoUsd + utilidadUsd + costosVariosUsd,
    };
  }, [cotizacionItems, form.aplica_costos_varios, form.porcentaje_utilidad]);

  const quoteNumber = useMemo(
    () => (cotizacionEditId ? `COT-${String(cotizacionEditId).padStart(4, "0")}` : buildQuoteNumber(cotizaciones)),
    [cotizacionEditId, cotizaciones],
  );

  function validateStep(step: number) {
    const nextErrors: Record<string, string> = {};
    if (step === 0) {
      if (!form.titulo?.trim()) nextErrors.titulo = "Requerido";
      if (!form.obra?.trim()) nextErrors.obra = "Requerido";
      if (!form.cliente?.trim()) nextErrors.cliente = "Requerido";
    }
    if (step === 1 && !cotizacionItems.length) nextErrors.items = "Agrega al menos un item";
    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((step) => Math.min(step + 1, 2));
  }

  async function saveCurrentQuote() {
    if (!validateStep(0) || !validateStep(1)) return;
    const saved = await saveCotizacion({ preventDefault: () => undefined });
    if (saved) setCurrentStep(0);
  }

  function clearQuote() {
    clearCotizacionDraft();
    setCurrentStep(0);
    setErrors({});
  }

  function startNewQuote() {
    clearQuote();
    setCotizacionWizardOpen(true);
  }

  function cancelWizard() {
    clearQuote();
    setCotizacionWizardOpen(false);
  }

  async function saveAndClose() {
    if (!validateStep(0) || !validateStep(1)) return;
    const saved = await saveCotizacion({ preventDefault: () => undefined });
    if (!saved) return;
    setCurrentStep(0);
    setCotizacionWizardOpen(false);
  }

  if (cotizacionWizardOpen) {
    return (
      <section className="quoteWizard grid gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="!m-0 text-xs font-extrabold uppercase tracking-wide text-sky-700">Modulo de cotizaciones</p>
              <h1 className="!m-0 mt-1 text-2xl font-extrabold text-slate-950">{cotizacionEditId ? "Editar cotizacion" : "Nueva cotizacion"}</h1>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
              <span className="block text-xs font-bold uppercase text-slate-500">Dolar oficial</span>
              <strong className="text-slate-950">{dolarVenta ? formatMoney(dolarVenta, "ARS") : "-"}</strong>
            </div>
          </div>
        </div>

        <StepIndicator currentStep={currentStep} />
        {errors.items && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{errors.items}</div>}

        {currentStep === 0 && <Step1Form form={form} setForm={setCotizacionForm} errors={errors} clientes={clientes} />}
        {currentStep === 1 && (
          <Step2Items
            form={form}
            setForm={setCotizacionForm}
            proveedores={proveedores}
            categorias={categorias}
            subcategorias={subcategorias}
            productosCotizacion={productosCotizacion}
            accesoriosAutomaticos={accesoriosAutomaticos}
            cotizacionProducto={cotizacionProducto}
            setCotizacionProducto={setCotizacionProducto}
            items={cotizacionItems}
            setItems={setCotizacionItems}
            dolarVenta={dolarVenta}
            totals={totals}
          />
        )}
        {currentStep === 2 && <Step3Preview form={form} items={cotizacionItems} totals={totals} quoteNumber={quoteNumber} dolarVenta={dolarVenta} />}

        <div className="quoteActionBar">
          <div className="quoteActionGroup">
            <button type="button" className="quoteBtn quoteBtnMuted" onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))} disabled={currentStep === 0}>Anterior</button>
            <button type="button" className="quoteBtn quoteBtnGhost" onClick={cancelWizard}>Cancelar</button>
          </div>
          <div className="quoteActionGroup">
            {currentStep < 2 ? (
              <button type="button" className="quoteBtn quoteBtnPrimary" onClick={nextStep}>Siguiente</button>
            ) : (
              <button type="button" className="quoteBtn quoteBtnPrimary" onClick={saveAndClose}><FileText size={16} />{cotizacionEditId ? "Guardar cambios" : "Guardar cotizacion"}</button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="quoteWizard grid gap-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="panelHead">
          <h2 className="!m-0 px-1 py-1">Cotizaciones</h2>
          <div className="rowActions">
            <button type="button" className="!rounded-lg !bg-slate-100 !text-slate-700 hover:!bg-slate-200" onClick={loadCotizaciones}>Actualizar</button>
            <button type="button" onClick={startNewQuote}>+ Nueva cotizacion</button>
          </div>
        </div>

        <div className="border-b border-slate-100 px-4 py-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {([null, "PENDIENTE", "APROBADA", "RECHAZADA"] as Array<EstadoCotizacion | null>).map((estado) => (
              <button
                key={estado ?? "all"}
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  estadoFiltro === estado
                    ? estado === "APROBADA"
                      ? "bg-green-600 text-white"
                        : estado === "RECHAZADA"
                          ? "bg-red-600 text-white"
                          : estado === "PENDIENTE"
                          ? "bg-yellow-500 text-white"
                          : "bg-sky-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                onClick={() => setEstadoFiltro(estado)}
              >
                {estado ?? "Todas"}
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Buscar por título, cliente u obra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        <div className="overflow-auto">
          <table><thead><tr><th>ID</th><th>Titulo</th><th>Cliente</th><th>Obra</th><th>Items</th><th>Estado</th><th>Precio venta</th><th>Fecha</th><th></th></tr></thead><tbody>
            {cotizacionesFiltradas.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.titulo}</td>
                <td>{item.cliente || "-"}</td>
                <td>{item.obra || "-"}</td>
                <td>{item._count?.items ?? "-"}</td>
                <td><StatusBadge estado={item.estado} /></td>
                <td>{formatMoney(item.total_usd, "USD")} +IVA</td>
                <td>{formatDate(item.creada_en)}</td>
                <td className="rowActions">
                  <button type="button" onClick={() => openCotizacion(item.id)}>Ver</button>
                  <button type="button" className="secondary" onClick={() => printCotizacionById(item.id)}>PDF</button>
                </td>
              </tr>
            ))}
            {!cotizacionesFiltradas.length && <tr><td colSpan={9}>Sin cotizaciones guardadas</td></tr>}
          </tbody></table>
        </div>
      </section>
    </section>
  );
}
