import { escapeHtml, formatDate, formatMoney } from "../../utils/format.js";

export function openCotizacionPdf(cotizacion) {
  if (!cotizacion) return { ok: true };

  const rows = (cotizacion.items || [])
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.tipo)}</td>
          <td>${escapeHtml(item.descripcion)}</td>
          <td>${escapeHtml(Number(item.cantidad).toLocaleString("es-AR"))} ${escapeHtml(item.unidad || "")}</td>
          <td>${escapeHtml(formatMoney(item.precio_unitario, item.moneda))}</td>
          <td>${escapeHtml(formatMoney(item.total_usd, "USD"))}</td>
        </tr>
      `,
    )
    .join("");

  const html = `
    <!doctype html>
    <html>
      <head>
        <title>Cotizacion ${escapeHtml(cotizacion.id)}</title>
        <style>
          * { box-sizing: border-box; }
          body { color: #18202a; font-family: Arial, sans-serif; margin: 32px; }
          header { border-bottom: 2px solid #1c5d99; margin-bottom: 22px; padding-bottom: 14px; }
          h1 { font-size: 24px; margin: 0 0 6px; }
          h2 { font-size: 16px; margin: 22px 0 10px; }
          p { margin: 4px 0; }
          .meta { display: grid; gap: 4px; grid-template-columns: 1fr 1fr; margin-top: 14px; }
          table { border-collapse: collapse; margin-top: 10px; width: 100%; }
          th, td { border-bottom: 1px solid #dce3ea; font-size: 12px; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #eef3f7; color: #405060; text-transform: uppercase; }
          .summary { border: 1px solid #dce3ea; margin-left: auto; margin-top: 18px; width: 340px; }
          .summary div { border-bottom: 1px solid #e5ebf0; display: flex; justify-content: space-between; gap: 12px; padding: 9px 12px; }
          .summary div:last-child { border-bottom: 0; }
          .summary strong { font-size: 12px; }
          .summary span { font-size: 12px; font-weight: 800; text-align: right; }
          .summary .sale { background: #eef3f7; }
          .summary .sale span { font-size: 16px; }
          @media print { body { margin: 18mm; } }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(cotizacion.titulo)}</h1>
          <p>Cotizacion #${escapeHtml(cotizacion.id)} - ${escapeHtml(formatDate(cotizacion.creada_en))}</p>
          <div class="meta">
            <p><strong>Cliente:</strong> ${escapeHtml(cotizacion.cliente || "-")}</p>
            <p><strong>Obra:</strong> ${escapeHtml(cotizacion.obra || "-")}</p>
            <p><strong>Tipo:</strong> ${escapeHtml(cotizacion.tipo === "DETECCION" ? "Deteccion" : "Extincion")}</p>
            <p><strong>Dolar referencia:</strong> ${escapeHtml(formatMoney(cotizacion.dolar_referencia, "ARS"))}</p>
            <p><strong>Items:</strong> ${escapeHtml((cotizacion.items || []).length)}</p>
          </div>
        </header>
        ${cotizacion.observaciones ? `<section><h2>Observaciones</h2><p>${escapeHtml(cotizacion.observaciones)}</p></section>` : ""}
        <section>
          <h2>Detalle</h2>
          <table>
            <thead><tr><th>Tipo</th><th>Descripcion</th><th>Cantidad</th><th>Precio unitario</th><th>Total USD</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
        <section class="summary">
          <div><strong>Costo directo de obra</strong><span>${escapeHtml(formatMoney(cotizacion.costo_directo_usd, "USD"))}</span></div>
          <div><strong>Utilidad ${escapeHtml(Number(cotizacion.porcentaje_utilidad || 0).toLocaleString("es-AR"))}%</strong><span>${escapeHtml(formatMoney(cotizacion.monto_utilidad_usd, "USD"))}</span></div>
          <div><strong>Subtotal</strong><span>${escapeHtml(formatMoney(cotizacion.subtotal_usd, "USD"))}</span></div>
          <div><strong>Costos varios ${escapeHtml(Number(cotizacion.porcentaje_costos_varios || 0).toLocaleString("es-AR"))}%</strong><span>${escapeHtml(formatMoney(cotizacion.monto_costos_varios_usd, "USD"))}</span></div>
          <div class="sale"><strong>Precio de venta</strong><span>${escapeHtml(formatMoney(cotizacion.total_usd, "USD"))} +IVA</span></div>
        </section>
        <script>
          window.addEventListener("load", () => {
            window.print();
          });
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return { ok: false, error: "El navegador bloqueo la ventana para generar el PDF" };

  printWindow.document.write(html);
  printWindow.document.close();
  return { ok: true };
}
