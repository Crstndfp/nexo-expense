import type { Currency } from "../types/api";

const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

export interface ExpenseFormValues {
  amount: string;
  currency: Currency;
  merchantName: string;
}

export interface ExpenseFormErrors {
  amount?: string;
  currency?: string;
  merchantName?: string;
}

export function validateAmount(rawAmount: string): string | undefined {
  if (!AMOUNT_REGEX.test(rawAmount)) {
    return "Ingresa un monto positivo con máximo 2 decimales (ej. 200.00).";
  }

  const [whole = "0", frac = ""] = rawAmount.split(".");
  const cents = BigInt(whole) * 100n + BigInt(frac.padEnd(2, "0"));
  if (cents <= 0n) {
    return "El monto debe ser mayor a cero.";
  }

  return undefined;
}

export function validateCurrency(currency: string): string | undefined {
  if (currency !== "GTQ" && currency !== "USD") {
    return "Selecciona GTQ o USD.";
  }
  return undefined;
}

export function validateMerchantName(rawMerchant: string): string | undefined {
  const trimmed = rawMerchant.trim();
  if (trimmed.length === 0) {
    return "El nombre del comercio es obligatorio.";
  }
  if (trimmed.length > 120) {
    return "El nombre del comercio no puede exceder 120 caracteres.";
  }
  return undefined;
}

export function validateExpenseForm(
  values: ExpenseFormValues,
): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};

  const amountError = validateAmount(values.amount);
  if (amountError) {
    errors.amount = amountError;
  }

  const currencyError = validateCurrency(values.currency);
  if (currencyError) {
    errors.currency = currencyError;
  }

  const merchantError = validateMerchantName(values.merchantName);
  if (merchantError) {
    errors.merchantName = merchantError;
  }

  return errors;
}

export function hasValidationErrors(errors: ExpenseFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
