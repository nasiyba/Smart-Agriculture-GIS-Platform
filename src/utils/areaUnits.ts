export function hectaresToSquareMeters(hectares: number | null | undefined): number {
  return Number(hectares ?? 0) * 10000;
}

export function formatSquareMeters(
  hectares: number | null | undefined,
  maximumFractionDigits = 0
): string {
  return `${hectaresToSquareMeters(hectares).toLocaleString(undefined, { maximumFractionDigits })} m²`;
}
