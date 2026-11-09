export const INR_PER_USD = 83;

export type Currency = "INR" | "USD";

const cents = (n: number | string) => Math.round(Number(n) * 100);

/** Adds two money values safely, in cents. */
export function addMoney(a: number | string, b: number | string): number {
  return (cents(a) + cents(b)) / 100;
}

export function toInr(amount: number, currency: Currency): number {
  return currency === "USD" ? amount * INR_PER_USD : amount;
}

/** PayPal sandbox is charged in USD. INR amounts are converted and rounded to cents. */
export function paypalCharge(total: number, currency: Currency) {
  const usd = currency === "INR" ? total / INR_PER_USD : total;
  return { currency_code: "USD", value: (Math.round(usd * 100) / 100).toFixed(2) };
}