const USD_TO_GTQ_RATE = "7.756250";
const GTQ_TO_GTQ_RATE = "1.000000";
const USD_TO_GTQ_RATE_SCALED = 7_756_250n; // 7.756250 * 10^6
const RATE_SCALE = 1_000_000n;
const HALF_SCALE = 500_000n; // Exact half for HALF_UP rounding

const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

export type Currency = "GTQ" | "USD";

export interface ConversionResult {
  originalAmount: string;
  originalCurrency: Currency;
  exchangeRateApplied: string;
  amountGtq: string;
  amountGtqCents: bigint;
}

export function parseAmountToCents(raw: string): bigint {
  if (!AMOUNT_REGEX.test(raw)) {
    throw new Error("Formato de monto inválido");
  }

  const [wholePart = "0", fracPart = ""] = raw.split(".");
  const centsPart = fracPart.padEnd(2, "0");
  const cents = BigInt(wholePart) * 100n + BigInt(centsPart);

  if (cents <= 0n) {
    throw new Error("El monto debe ser mayor a cero");
  }

  return cents;
}

export function formatCentsToAmount(cents: bigint): string {
  const isNegative = cents < 0n;
  const abs = isNegative ? -cents : cents;

  const whole = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, "0");

  return `${isNegative ? "-" : ""}${whole.toString()}.${frac}`;
}

export function convertToGtq(amount: string, currency: Currency): ConversionResult {
  const originalCents = parseAmountToCents(amount);
  const normalizedOriginal = formatCentsToAmount(originalCents);

  if (currency === "GTQ") {
    return {
      originalAmount: normalizedOriginal,
      originalCurrency: currency,
      exchangeRateApplied: GTQ_TO_GTQ_RATE,
      amountGtq: normalizedOriginal,
      amountGtqCents: originalCents,
    };
  }

  // BigInt division truncates toward zero.
  // Adding HALF_SCALE (0.5 * 10^6) before dividing implements exact HALF_UP rounding.
  const scaled = originalCents * USD_TO_GTQ_RATE_SCALED;
  const convertedCents = (scaled + HALF_SCALE) / RATE_SCALE;

  return {
    originalAmount: normalizedOriginal,
    originalCurrency: currency,
    exchangeRateApplied: USD_TO_GTQ_RATE,
    amountGtq: formatCentsToAmount(convertedCents),
    amountGtqCents: convertedCents,
  };
}
