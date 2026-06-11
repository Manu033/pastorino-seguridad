import React, { useState } from "react";
import { Actions, Field, Select } from "../../components/ui.jsx";
import { PROMPT_EXTRACCION_PRECIOS } from "../../constants/forms.js";

export function ImportacionesTab({ importProveedorId, setImportProveedorId, proveedores, importJson, setImportJson, importarJson, importResult }) {
  const [copied, setCopied] = useState(false);

  function copyPrompt() {
    navigator.clipboard.writeText(PROMPT_EXTRACCION_PRECIOS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="legacyGrid">
      <section className="panel">
        <h2>Importar JSON normalizado</h2>
        <p className="hint">
          Convertí tu lista de precios con IA:{" "}
          <button type="button" className="link-button" onClick={copyPrompt}>
            {copied ? "Copiado!" : "Copiar prompt"}
          </button>
          {" "}y pegalo junto con tu archivo en Claude.ai o ChatGPT.
        </p>
        <Field label="Proveedor"><Select value={importProveedorId} onChange={setImportProveedorId}><option value="">Seleccionar</option>{proveedores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>
        <textarea className="jsonArea" value={importJson} onChange={(event) => setImportJson(event.target.value)} />
        <Actions><button type="button" onClick={() => importarJson(true)}>Preview</button><button type="button" onClick={() => importarJson(false)}>Procesar</button></Actions>
      </section>
      <section className="panel wide">
        <h2>Resultado</h2>
        <pre>{importResult ? JSON.stringify(importResult, null, 2) : "Sin resultado"}</pre>
      </section>
    </section>
  );
}
