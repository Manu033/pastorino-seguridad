import { useState } from "react";
import { request } from "../../api/client.js";
import { sampleImport } from "../../constants/forms.js";

export function useImportaciones({ apiUrl, run, loadProductosBusqueda, loadProductosProveedor }) {
  const [importProveedorId, setImportProveedorId] = useState("");
  const [importJson, setImportJson] = useState(sampleImport);
  const [importResult, setImportResult] = useState(null);

  async function importarJson(preview) {
    await run(preview ? "Preview validado" : "Importacion procesada", async () => {
      const parsed = JSON.parse(importJson);
      const data = await request(
        apiUrl,
        `/importaciones/${importProveedorId}/${preview ? "preview-json" : "procesar-json"}`,
        {
          method: "POST",
          body: JSON.stringify(parsed),
        },
      );
      setImportResult(data);
      if (!preview) await loadProductosProveedor();
      if (!preview) await loadProductosBusqueda();
    });
  }

  return {
    importProveedorId,
    setImportProveedorId,
    importJson,
    setImportJson,
    importResult,
    importarJson,
  };
}
