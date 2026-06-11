import { useState } from "react";
import { DOLAR_OFICIAL_URL } from "../constants/forms.js";
import { request } from "../api/client.js";
import { toNumber } from "../utils/format.js";

export function useHealth() {
  const [health, setHealth] = useState("sin comprobar");
  const [dolarOficial, setDolarOficial] = useState(null);
  const [dolarError, setDolarError] = useState("");

  const dolarVenta = toNumber(dolarOficial?.venta);

  async function checkHealth(apiUrl, run) {
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

  return { health, dolarOficial, dolarError, dolarVenta, checkHealth, loadDolarOficial };
}
