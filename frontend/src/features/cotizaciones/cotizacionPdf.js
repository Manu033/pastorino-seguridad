import { escapeHtml, formatDate, formatMoney } from "../../utils/format.js";

export function openCotizacionPdf(cotizacion) {
  if (!cotizacion) return { ok: true };

  const items = cotizacion.items || [];
  const rows = items
    .map(
      (item, i) => `
        <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
          <td class="col-tipo">${escapeHtml(item.tipo === "PRODUCTO" ? "Prod." : "Man.")}</td>
          <td class="col-desc">${escapeHtml(item.descripcion)}</td>
          <td class="col-num">${escapeHtml(Number(item.cantidad).toLocaleString("es-AR"))} ${escapeHtml(item.unidad || "")}</td>
          <td class="col-num">${escapeHtml(formatMoney(item.precio_unitario, item.moneda))}</td>
          <td class="col-num total-cell">${escapeHtml(formatMoney(item.total_usd, "USD"))}</td>
        </tr>
      `,
    )
    .join("");

  const quoteNumber = `COT-${new Date(cotizacion.creada_en).getFullYear()}-${String(cotizacion.id).padStart(3, "0")}`;
  const tipo = cotizacion.tipo === "DETECCION" ? "Deteccion" : "Extincion";

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(quoteNumber)} — Pastorino Seguridad</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            color: #1a2332;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            line-height: 1.5;
          }

          /* ── HEADER ─────────────────────────────────────────────── */
          .doc-header {
            background: #0c4a6e;
            color: #fff;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding: 28px 36px;
          }

          .company-name {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.3px;
            color: #fff;
          }

          .company-sub {
            font-size: 10px;
            color: #bae6fd;
            margin-top: 3px;
          }

          .doc-badge {
            text-align: right;
          }

          .doc-badge .label {
            font-size: 9px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #7dd3fc;
          }

          .doc-badge .number {
            font-size: 22px;
            font-weight: 800;
            color: #fff;
            line-height: 1.1;
          }

          .doc-badge .tipo-badge {
            display: inline-block;
            background: rgba(255,255,255,0.15);
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1px;
            padding: 2px 8px;
            margin-top: 6px;
            text-transform: uppercase;
          }

          /* ── META BAR ────────────────────────────────────────────── */
          .meta-bar {
            background: #f0f7ff;
            border-bottom: 2px solid #0c4a6e;
            display: flex;
            gap: 0;
            padding: 0;
          }

          .meta-cell {
            border-right: 1px solid #d1e4f0;
            flex: 1;
            padding: 10px 16px;
          }

          .meta-cell:last-child { border-right: none; }

          .meta-cell .key {
            color: #5c7a8a;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .meta-cell .val {
            color: #1a2332;
            font-size: 11px;
            font-weight: 600;
            margin-top: 2px;
          }

          /* ── BODY ────────────────────────────────────────────────── */
          .doc-body {
            padding: 24px 36px;
          }

          /* ── PARTIES ─────────────────────────────────────────────── */
          .parties {
            display: grid;
            gap: 16px;
            grid-template-columns: 1fr 1fr;
            margin-bottom: 20px;
          }

          .party-block {
            border: 1px solid #d1e4f0;
            border-radius: 4px;
            overflow: hidden;
          }

          .party-block .block-title {
            background: #0c4a6e;
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1.5px;
            padding: 5px 12px;
            text-transform: uppercase;
          }

          .party-block table {
            width: 100%;
            border-collapse: collapse;
          }

          .party-block td {
            border: none;
            font-size: 11px;
            padding: 4px 12px;
          }

          .party-block td:first-child {
            color: #5c7a8a;
            font-weight: 700;
            width: 90px;
          }

          /* ── PROJECT BAND ────────────────────────────────────────── */
          .project-band {
            background: #f0f7ff;
            border: 1px solid #d1e4f0;
            border-radius: 4px;
            margin-bottom: 20px;
            padding: 10px 14px;
          }

          .project-band .proj-title {
            font-size: 13px;
            font-weight: 800;
            color: #0c4a6e;
          }

          .project-band .proj-sub {
            color: #5c7a8a;
            font-size: 10px;
            margin-top: 2px;
          }

          /* ── OBSERVATIONS ────────────────────────────────────────── */
          .obs-block {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 4px;
            margin-bottom: 20px;
            padding: 10px 14px;
          }

          .obs-block .obs-title {
            color: #92400e;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 4px;
            text-transform: uppercase;
          }

          /* ── TABLE ───────────────────────────────────────────────── */
          .section-title {
            border-bottom: 2px solid #0c4a6e;
            color: #0c4a6e;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 8px;
            padding-bottom: 4px;
            text-transform: uppercase;
          }

          table.items {
            border-collapse: collapse;
            width: 100%;
          }

          table.items thead tr {
            background: #0c4a6e;
          }

          table.items th {
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.8px;
            padding: 7px 10px;
            text-align: left;
            text-transform: uppercase;
          }

          table.items th.col-num { text-align: right; }

          table.items td {
            border-bottom: 1px solid #e8f0f7;
            font-size: 11px;
            padding: 7px 10px;
            vertical-align: top;
          }

          table.items .col-tipo { color: #5c7a8a; font-size: 10px; width: 44px; }
          table.items .col-num  { text-align: right; white-space: nowrap; }
          table.items .total-cell { color: #0c4a6e; font-weight: 700; }

          .row-even { background: #fff; }
          .row-odd  { background: #f7fbff; }

          /* ── TOTALS ──────────────────────────────────────────────── */
          .totals-wrap {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }

          .totals-table {
            border: 1px solid #d1e4f0;
            border-radius: 4px;
            overflow: hidden;
            width: 320px;
          }

          .totals-table .t-row {
            border-bottom: 1px solid #e8f0f7;
            display: flex;
            justify-content: space-between;
            padding: 7px 14px;
          }

          .totals-table .t-row:last-child { border-bottom: none; }

          .totals-table .t-label { color: #5c7a8a; font-size: 11px; }
          .totals-table .t-val   { font-size: 11px; font-weight: 700; text-align: right; }

          .totals-table .t-final {
            background: #0c4a6e;
            color: #fff;
          }

          .totals-table .t-final .t-label { color: #bae6fd; font-size: 11px; font-weight: 700; }
          .totals-table .t-final .t-val   { color: #fff; font-size: 15px; }

          /* ── FOOTER ──────────────────────────────────────────────── */
          .doc-footer {
            border-top: 1px solid #d1e4f0;
            color: #8aa0b0;
            font-size: 9px;
            margin-top: 32px;
            padding-top: 10px;
            text-align: center;
          }

          @media print {
            body { font-size: 10px; }
            .doc-header { padding: 20px 28px; }
            .doc-body { padding: 18px 28px; }
          }

          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        </style>
      </head>
      <body>

        <!-- HEADER -->
        <div class="doc-header">
          <div>
            <div class="company-name">Pastorino Seguridad</div>
            <div class="company-sub">Instalaciones de seguridad contra incendios</div>
          </div>
          <div class="doc-badge">
            <div class="label">Cotizacion tecnica</div>
            <div class="number">${escapeHtml(quoteNumber)}</div>
            <div class="tipo-badge">${escapeHtml(tipo)}</div>
          </div>
        </div>

        <!-- META BAR -->
        <div class="meta-bar">
          <div class="meta-cell">
            <div class="key">Fecha de emision</div>
            <div class="val">${escapeHtml(formatDate(cotizacion.creada_en))}</div>
          </div>
          <div class="meta-cell">
            <div class="key">Valida hasta</div>
            <div class="val">${escapeHtml(cotizacion.valida_hasta ? formatDate(cotizacion.valida_hasta) : "-")}</div>
          </div>
          <div class="meta-cell">
            <div class="key">Dolar referencia</div>
            <div class="val">${escapeHtml(formatMoney(cotizacion.dolar_referencia, "ARS"))}</div>
          </div>
          <div class="meta-cell">
            <div class="key">Items</div>
            <div class="val">${escapeHtml(String(items.length))}</div>
          </div>
        </div>

        <div class="doc-body">

          <!-- PARTIES -->
          <div class="parties">
            <div class="party-block">
              <div class="block-title">Ofertante</div>
              <table>
                <tr><td>Empresa</td><td>Pastorino Seguridad</td></tr>
                <tr><td>Condicion pago</td><td>A convenir</td></tr>
                <tr><td>Plazo entrega</td><td>Segun disponibilidad y avance de obra</td></tr>
              </table>
            </div>
            <div class="party-block">
              <div class="block-title">Cliente</div>
              <table>
                <tr><td>Razon social</td><td>${escapeHtml(cotizacion.cliente || "-")}</td></tr>
                <tr><td>Atencion a</td><td>${escapeHtml(cotizacion.contacto_cliente || "-")}</td></tr>
                <tr><td>CUIT</td><td>${escapeHtml(cotizacion.cuit_cliente || "-")}</td></tr>
                <tr><td>Email</td><td>${escapeHtml(cotizacion.email_cliente || "-")}</td></tr>
              </table>
            </div>
          </div>

          <!-- PROJECT -->
          <div class="project-band">
            <div class="proj-title">${escapeHtml(cotizacion.titulo || "Cotizacion sin titulo")}</div>
            <div class="proj-sub">Obra / Proyecto: ${escapeHtml(cotizacion.obra || "-")}</div>
          </div>

          ${cotizacion.observaciones ? `
          <div class="obs-block">
            <div class="obs-title">Observaciones</div>
            <div>${escapeHtml(cotizacion.observaciones)}</div>
          </div>` : ""}

          <!-- ITEMS TABLE -->
          <div class="section-title">Detalle de items</div>
          <table class="items">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descripcion</th>
                <th class="col-num">Cantidad</th>
                <th class="col-num">Precio unit.</th>
                <th class="col-num">Total USD</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <!-- TOTALS -->
          <div class="totals-wrap">
            <div class="totals-table">
              <div class="t-row"><span class="t-label">Costo directo de obra</span><span class="t-val">${escapeHtml(formatMoney(cotizacion.costo_directo_usd, "USD"))}</span></div>
              <div class="t-row"><span class="t-label">Utilidad (${escapeHtml(String(cotizacion.porcentaje_utilidad || 0))}%)</span><span class="t-val">${escapeHtml(formatMoney(cotizacion.monto_utilidad_usd, "USD"))}</span></div>
              <div class="t-row"><span class="t-label">Subtotal</span><span class="t-val">${escapeHtml(formatMoney(cotizacion.subtotal_usd, "USD"))}</span></div>
              ${cotizacion.aplica_costos_varios ? `<div class="t-row"><span class="t-label">Costos varios (${escapeHtml(String(cotizacion.porcentaje_costos_varios || 0))}%)</span><span class="t-val">${escapeHtml(formatMoney(cotizacion.monto_costos_varios_usd, "USD"))}</span></div>` : ""}
              <div class="t-row t-final"><span class="t-label">Precio de venta</span><span class="t-val">${escapeHtml(formatMoney(cotizacion.total_usd, "USD"))} +IVA</span></div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="doc-footer">
            Pastorino Seguridad — Cotizacion ${escapeHtml(quoteNumber)} — Precios en USD, IVA no incluido. Documento generado el ${escapeHtml(formatDate(new Date().toISOString()))}.
          </div>

        </div>

        <script>
          window.addEventListener("load", () => { window.print(); });
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=960,height=780");
  if (!printWindow) return { ok: false, error: "El navegador bloqueo la ventana para generar el PDF" };

  printWindow.document.write(html);
  printWindow.document.close();
  return { ok: true };
}
