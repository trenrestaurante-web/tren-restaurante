// Conversión de precios. MXN es la moneda oficial de cobro;
// USD es informativo (aproximado).
export const MXN_TO_USD = 0.0589;

export function convertMXNtoUSD(priceMXN: number): string {
  return (priceMXN * MXN_TO_USD).toFixed(2);
}

// Formato de peso mexicano con separador de miles
export function fmtMXN(n: number): string {
  return n.toLocaleString('es-MX');
}
