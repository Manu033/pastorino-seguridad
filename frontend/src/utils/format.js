export function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}

export function cleanText(value) {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

export function formatMoney(value, currency) {
  if (value === null || value === undefined || value === "") return "-";
  return `${currency || ""} ${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`.trim();
}

export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR");
}

export function formatShortDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
