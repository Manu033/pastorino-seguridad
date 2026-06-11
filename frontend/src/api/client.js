export async function request(apiUrl, path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const detail = data?.detail || data?.message || data?.error || JSON.stringify(data);
    throw new Error(detail || `Error HTTP ${response.status}`);
  }
  return data;
}
