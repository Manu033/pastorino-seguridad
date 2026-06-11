import { toNumber } from "../../utils/format.js";

export function calcularResumenCotizacion(costoDirectoUsd, porcentajeUtilidad, aplicaCostosVarios, porcentajeCostosVarios) {
  const costo_directo_usd = toNumber(costoDirectoUsd);
  const porcentaje_utilidad = toNumber(porcentajeUtilidad);
  const monto_utilidad_usd = costo_directo_usd * (porcentaje_utilidad / 100);
  const aplica_costos_varios = Boolean(aplicaCostosVarios);
  const porcentaje_costos_varios = aplica_costos_varios ? toNumber(porcentajeCostosVarios) : 0;
  const monto_costos_varios_usd = aplica_costos_varios ? costo_directo_usd * (porcentaje_costos_varios / 100) : 0;
  const subtotal_usd = costo_directo_usd + monto_utilidad_usd;
  const total_usd = subtotal_usd + monto_costos_varios_usd;

  return {
    costo_directo_usd,
    porcentaje_utilidad,
    monto_utilidad_usd,
    subtotal_usd,
    aplica_costos_varios,
    porcentaje_costos_varios,
    monto_costos_varios_usd,
    total_usd,
  };
}
