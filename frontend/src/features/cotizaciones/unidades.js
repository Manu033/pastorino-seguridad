import { toNumber } from "../../utils/format.js";

export function calcularCompraProducto(producto, cantidadRequerida) {
  const requerida = toNumber(cantidadRequerida);
  const equivalencia = toNumber(producto?.cantidad_por_unidad_compra) || 1;
  const unidadCompra = producto?.unidad || "";
  const unidadCalculo = producto?.unidad_calculo || unidadCompra;
  const compraExacta = equivalencia > 0 ? requerida / equivalencia : requerida;
  const cantidadCompra = producto?.redondeo_compra === "ARRIBA" ? Math.ceil(compraExacta) : compraExacta;

  return {
    cantidadRequerida: requerida,
    unidadCompra,
    unidadCalculo,
    equivalencia,
    compraExacta,
    cantidadCompra,
    usaConversion: Boolean(producto?.unidad_calculo) && (unidadCalculo !== unidadCompra || equivalencia !== 1),
  };
}

export function describirCompraProducto(producto, cantidadRequerida) {
  const calculo = calcularCompraProducto(producto, cantidadRequerida);
  if (!calculo.usaConversion) return null;

  return `Requerido: ${calculo.cantidadRequerida.toLocaleString("es-AR")} ${calculo.unidadCalculo}. Compra: ${calculo.cantidadCompra.toLocaleString("es-AR")} ${calculo.unidadCompra} de ${calculo.equivalencia.toLocaleString("es-AR")} ${calculo.unidadCalculo}.`;
}
