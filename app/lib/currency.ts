/** Formata valores em reais: currency.format(150) -> "R$ 150,00" */
export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
