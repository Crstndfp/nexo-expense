import { ValidationError } from "../../domain/errors.js";
import { parseAmountToCents, type Currency } from "../../domain/money.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ValidatedCreateExpenseInput {
  idempotencyKey: string;
  amount: string;
  currency: Currency;
  merchantName: string;
}

export function validateCreateExpenseInput(
  rawIdempotencyKey: string | undefined,
  rawBody: unknown,
): ValidatedCreateExpenseInput {
  const fields: Record<string, string> = {};

  const trimmedKey = rawIdempotencyKey?.trim() ?? "";
  if (!trimmedKey || !UUID_REGEX.test(trimmedKey)) {
    fields["Idempotency-Key"] = "Debe ser un UUID válido.";
  }

  const body =
    rawBody !== null && typeof rawBody === "object" && !Array.isArray(rawBody)
      ? (rawBody as Record<string, unknown>)
      : {};

  let validAmount = "";
  if (typeof body.amount !== "string") {
    fields.amount = 'Debe enviarse como texto (por ejemplo "200.00").';
  } else {
    try {
      parseAmountToCents(body.amount);
      validAmount = body.amount;
    } catch {
      fields.amount = "Debe ser mayor a cero y tener máximo 2 decimales.";
    }
  }

  let validCurrency: Currency = "GTQ";
  if (body.currency !== "GTQ" && body.currency !== "USD") {
    fields.currency = "Debe ser GTQ o USD.";
  } else {
    validCurrency = body.currency;
  }

  let validMerchantName = "";
  if (typeof body.merchantName !== "string") {
    fields.merchantName = "Es obligatorio.";
  } else {
    const trimmedMerchant = body.merchantName.trim();
    if (trimmedMerchant.length === 0 || trimmedMerchant.length > 120) {
      fields.merchantName = "Debe tener entre 1 y 120 caracteres.";
    } else {
      validMerchantName = trimmedMerchant;
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new ValidationError("Revisa los datos enviados.", fields);
  }

  return {
    idempotencyKey: trimmedKey.toLowerCase(),
    amount: validAmount,
    currency: validCurrency,
    merchantName: validMerchantName,
  };
}
