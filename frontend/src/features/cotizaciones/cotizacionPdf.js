import fondoPdfCotizacion from "../../assets/imagenes/fondo_pdf_cotizacion.jpg";
import { escapeHtml, formatDate, formatMoney } from "../../utils/format.js";

export function openCotizacionPdf(cotizacion) {
  if (!cotizacion) return { ok: true };

  const items = cotizacion.items || [];
  const quoteNumber = `COT-${new Date(cotizacion.creada_en).getFullYear()}-${String(cotizacion.id).padStart(3, "0")}`;
  const tipo = cotizacion.tipo === "DETECCION" ? "Deteccion" : "Extincion";
  const fondoPdfUrl = escapeHtml(fondoPdfCotizacion);

  const fechaEmision = cotizacion.fecha_emision
    ? new Date(cotizacion.fecha_emision).toISOString().slice(0, 10)
    : new Date(cotizacion.creada_en).toISOString().slice(0, 10);
  const fechaValidez = (() => {
    if (!cotizacion.validez_dias) return null;
    const d = new Date(`${fechaEmision}T00:00:00`);
    d.setDate(d.getDate() + Number(cotizacion.validez_dias));
    return d.toISOString().slice(0, 10);
  })();

  const rowWeight = (item) => Math.max(1, Math.ceil(String(item.descripcion || "").length / 72));
  const pages = [];
  for (let index = 0; index < items.length || pages.length === 0;) {
    const firstPage = pages.length === 0;
    const budget = firstPage ? 20 : 30;
    const pageItems = [];
    let used = 0;

    while (index < items.length && used + rowWeight(items[index]) <= budget) {
      pageItems.push(items[index]);
      used += rowWeight(items[index]);
      index += 1;
    }

    if (pageItems.length === 0 && index < items.length) pageItems.push(items[index++]);
    pages.push(pageItems);
  }

  const renderRows = (pageItems) => pageItems
    .map(
      (item) => `
        <tr>
          <td class="col-desc">${escapeHtml(item.descripcion)}</td>
          <td class="col-num">${escapeHtml(Number(item.cantidad).toLocaleString("es-AR"))}</td>
          <td>${escapeHtml(item.unidad || "-")}</td>
          <td class="col-num">${escapeHtml(formatMoney(item.precio_unitario, item.moneda))}</td>
          <td class="col-num strong">${escapeHtml(formatMoney(item.total_usd, "USD"))}</td>
        </tr>
      `,
    )
    .join("");

  const renderTable = (pageItems) => `
    <table class="items">
      <thead>
        <tr>
          <th>Detalle</th>
          <th class="col-num">Cant.</th>
          <th>Unidad</th>
          <th class="col-num">Precio unitario</th>
          <th class="col-num">Importe</th>
        </tr>
      </thead>
      <tbody>${renderRows(pageItems)}</tbody>
    </table>
  `;

  const renderTotals = () => `
    <div class="totals-wrap">
      <div class="totals-table">
        <div class="t-row"><span>Costo directo de obra</span><span class="strong">${escapeHtml(formatMoney(cotizacion.costo_directo_usd, "USD"))}</span></div>
        <div class="t-row"><span>Utilidad (${escapeHtml(String(cotizacion.porcentaje_utilidad || 0))}%)</span><span class="strong">${escapeHtml(formatMoney(cotizacion.monto_utilidad_usd, "USD"))}</span></div>
        <div class="t-row"><span>Subtotal</span><span class="strong">${escapeHtml(formatMoney(cotizacion.subtotal_usd, "USD"))}</span></div>
        ${cotizacion.aplica_costos_varios ? `<div class="t-row"><span>Costos varios (${escapeHtml(String(cotizacion.porcentaje_costos_varios || 0))}%)</span><span class="strong">${escapeHtml(formatMoney(cotizacion.monto_costos_varios_usd, "USD"))}</span></div>` : ""}
        <div class="t-row t-final"><span>Precio de venta</span><span>${escapeHtml(formatMoney(cotizacion.total_usd, "USD"))} +IVA</span></div>
      </div>
    </div>
  `;

  const renderHeader = () => `
    <section class="quote-head">
      <div class="client-box">
        <div class="line"><span class="label">Cliente:</span><span>${escapeHtml(cotizacion.cliente || "-")}</span></div>
        <div class="line"><span class="label">C.U.I.T.:</span><span>${escapeHtml(cotizacion.cuit_cliente || "-")}</span></div>
        <div class="line"><span class="label">Contacto:</span><span>${escapeHtml(cotizacion.contacto_cliente || "-")}</span></div>
        <div class="line"><span class="label">Email:</span><span>${escapeHtml(cotizacion.email_cliente || "-")}</span></div>
        <div class="line"><span class="label">Condicion:</span><span>A convenir</span></div>
        <div class="line"><span class="label">Moneda:</span><span>${escapeHtml(cotizacion.moneda_base)}</span></div>
      </div>

      <div class="quote-box">
        <div class="quote-title">Presupuesto</div>
        <div class="line"><span class="label">Nro:</span><span>${escapeHtml(quoteNumber)}</span></div>
        <div class="line"><span class="label">Fecha:</span><span>${escapeHtml(formatDate(fechaEmision))}</span></div>
        <div class="line"><span class="label">Validez:</span><span>${escapeHtml(fechaValidez ? formatDate(fechaValidez) : "-")}</span></div>
        <div class="line"><span class="label">Tipo:</span><span>${escapeHtml(tipo)}</span></div>
        <div class="line"><span class="label">Dolar:</span><span>${escapeHtml(formatMoney(cotizacion.dolar_referencia, "ARS"))}</span></div>
      </div>
    </section>

    <section class="project-box">
      <div class="project-title">${escapeHtml(cotizacion.titulo || "Cotizacion sin titulo")}</div>
      <div><span class="label">Obra / Proyecto:</span> ${escapeHtml(cotizacion.obra || "-")}</div>
      <div><span class="label">Plazo entrega:</span> ${escapeHtml(cotizacion.plazo_entrega || "Segun disponibilidad y avance de obra")}</div>
    </section>

    ${cotizacion.observaciones ? `
    <section class="notes-box">
      <span class="label">Observaciones:</span> ${escapeHtml(cotizacion.observaciones)}
    </section>` : ""}
  `;

  const renderedPages = pages
    .map((pageItems, index) => `
      <section class="sheet">
        <img class="pdf-bg" src="${fondoPdfUrl}" alt="" />
        <main class="page">
          ${index === 0 ? renderHeader() : ""}
          ${renderTable(pageItems)}
          ${index === pages.length - 1 ? renderTotals() : ""}
        </main>
      </section>
    `)
    .join("");

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(quoteNumber)} - Pastorino Seguridad</title>
        <style>
          @page { size: A4; margin: 0; }

          * { box-sizing: border-box; margin: 0; padding: 0; }

          html { background: #eee; }

          body {
            color: #111;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            line-height: 1.35;
            margin: 0 auto;
            width: 210mm;
          }

          .sheet {
            height: 297mm;
            overflow: hidden;
            page-break-after: always;
            position: relative;
            width: 210mm;
          }

          .sheet:last-child { page-break-after: auto; }

          .pdf-bg {
            height: 297mm;
            left: 0;
            position: absolute;
            top: 0;
            width: 210mm;
            z-index: 0;
          }

          .page {
            padding: 38mm 13mm 32mm;
            position: relative;
            z-index: 1;
          }

          .quote-head {
            align-items: flex-start;
            display: flex;
            justify-content: space-between;
            gap: 10mm;
            margin-bottom: 4mm;
          }

          .client-box,
          .quote-box,
          .project-box,
          .notes-box,
          .totals-table {
            background: rgba(255, 255, 255, 0.72);
            border: 1px solid #222;
            border-radius: 3px;
          }

          .client-box {
            flex: 1;
            padding: 2mm 3mm;
          }

          .quote-box {
            min-width: 62mm;
            padding: 3mm;
          }

          .quote-title {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.3px;
            margin-bottom: 2mm;
            text-align: center;
            text-transform: uppercase;
          }

          .line {
            display: grid;
            gap: 2mm;
            grid-template-columns: 25mm 1fr;
            margin: 0.7mm 0;
          }

          .label { font-weight: 800; text-transform: uppercase; }
          .strong { font-weight: 800; }

          .project-box,
          .notes-box {
            margin-bottom: 3mm;
            padding: 2mm 3mm;
          }

          .project-title {
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 1mm;
            text-transform: uppercase;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          .items {
            background: rgba(255, 255, 255, 0.64);
            border: 1px solid #222;
            margin-top: 3mm;
          }

          .items th {
            border-bottom: 1px solid #222;
            font-size: 9px;
            font-weight: 800;
            padding: 1.6mm 1.8mm;
            text-align: left;
          }

          .items td {
            border-bottom: 1px solid rgba(0, 0, 0, 0.18);
            padding: 1.7mm 1.8mm;
            vertical-align: top;
          }

          .items .col-desc { font-weight: 700; }
          .items .col-num { text-align: right; white-space: nowrap; }

          .totals-wrap {
            display: flex;
            justify-content: flex-end;
            margin-top: 4mm;
          }

          .totals-table {
            overflow: hidden;
            width: 72mm;
          }

          .t-row {
            border-bottom: 1px solid rgba(0, 0, 0, 0.18);
            display: flex;
            justify-content: space-between;
            padding: 1.8mm 3mm;
          }

          .t-row:last-child { border-bottom: none; }
          .t-final { font-size: 12px; font-weight: 800; }

          @media print {
            @page { size: A4; margin: 0; }

            html { background: transparent; }
            body {
              -webkit-print-color-adjust: exact;
              margin: 0;
              print-color-adjust: exact;
              width: 210mm;
            }

            .sheet { break-after: page; }
            .sheet:last-child { break-after: auto; }
          }
        </style>
      </head>
      <body>
        ${renderedPages}

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
