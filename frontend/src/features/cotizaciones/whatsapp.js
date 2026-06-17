/**
 * WhatsApp link utilities for cotizaciones.
 *
 * NOTE: Argentine mobile wa.me links may require 549 (country 54 + mobile prefix 9)
 * instead of just 54. The spec examples use 54 prefix. Verify with a real number
 * if links do not open the correct chat.
 */

/**
 * Strip non-digit characters from a phone string and ensure the Argentine
 * country code (54) is present. Returns an empty string if input is falsy.
 *
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function sanitizePhone(raw) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Prepend country code if not already present
  if (!digits.startsWith("54")) {
    return "54" + digits;
  }
  return digits;
}

/**
 * Build WhatsApp link descriptors grouped by proveedor for a cotizacion's items.
 * Only PRODUCTO type items are included; MANUAL items are excluded.
 * Groups with zero PRODUCTO items are omitted.
 *
 * @param {Array<{
 *   tipo: string,
 *   descripcion: string,
 *   cantidad: number,
 *   producto_proveedor?: {
 *     proveedor?: { id: number, nombre: string, telefono?: string | null }
 *   } | null
 * }>} items
 * @returns {Array<{
 *   proveedorId: number,
 *   proveedorNombre: string,
 *   telefono: string | null,
 *   hasPhone: boolean,
 *   url: string | null,
 *   productos: string[]
 * }>}
 */
export function buildWhatsAppLinks(items) {
  if (!items || !items.length) return [];

  // Only PRODUCTO items with a proveedor
  const productoItems = items.filter(
    (item) => item.tipo === "PRODUCTO" && item.producto_proveedor?.proveedor,
  );

  // Group by proveedor id
  const groups = new Map();
  for (const item of productoItems) {
    const proveedor = item.producto_proveedor.proveedor;
    const id = proveedor.id;
    if (!groups.has(id)) {
      groups.set(id, {
        proveedorId: id,
        proveedorNombre: proveedor.nombre,
        telefono: proveedor.telefono ?? null,
        productos: [],
      });
    }
    const cantidadDisplay = Number(item.cantidad) % 1 === 0
      ? String(Number(item.cantidad))
      : Number(item.cantidad).toLocaleString("es-AR");
    groups.get(id).productos.push(`${item.descripcion} x${cantidadDisplay}`);
  }

  return Array.from(groups.values()).map((group) => {
    const sanitized = sanitizePhone(group.telefono);
    const hasPhone = sanitized.length > 0;

    let url = null;
    if (hasPhone) {
      const message = `Hola ${group.proveedorNombre}, necesito los siguientes productos:\n- ${group.productos.join("\n- ")}`;
      url = `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
    }

    return {
      proveedorId: group.proveedorId,
      proveedorNombre: group.proveedorNombre,
      telefono: group.telefono,
      hasPhone,
      url,
      productos: group.productos,
    };
  });
}
