import React from "react";
import Logo from "../assets/imagenes/logo-completo.jpg";
import { Field, TextInput } from "./ui.jsx";
import { formatMoney, formatShortDate } from "../utils/format.js";

export function AppHeader({ apiUrl, setApiUrl, checkHealth, health, dolarOficial, dolarError }) {
  return (
    <header className="topbar">
      <div>
        <img src={Logo} alt="Logo Pastorino" className="Logo" />
        <p>Administracion de proveedores, productos de proveedor e historial de precios.</p>
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
  );
}

export function Tabs({ tabs, activeTab, setActiveTab }) {
  return (
    <nav className="tabs">
      {tabs.map(([id, label]) => (
        <button type="button" className={activeTab === id ? "active" : ""} key={id} onClick={() => setActiveTab(id)}>
          {label}
        </button>
      ))}
    </nav>
  );
}
