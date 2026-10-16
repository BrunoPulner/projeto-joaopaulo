
export function formatCurrency(valueCents: number): string {
  const cents = Number.isFinite(valueCents)
    ? Math.max(0, Math.trunc(valueCents))
    : 0;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
