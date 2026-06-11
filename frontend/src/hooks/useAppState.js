import { useState } from "react";
import { API_DEFAULT } from "../constants/forms.js";

export function useAppState() {
  const [apiUrl, setApiUrl] = useState(API_DEFAULT);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return { apiUrl, setApiUrl, status, error, setError, loading, run };
}
