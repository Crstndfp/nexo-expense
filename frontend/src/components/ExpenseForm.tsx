import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiRequestError, createExpenseRequest } from "../api/nexoApi";
import type { Currency, ExpenseResponse } from "../types/api";
import {
  hasValidationErrors,
  validateExpenseForm,
  type ExpenseFormErrors,
  type ExpenseFormValues,
} from "../validation/expenseValidation";

interface ExpenseFormProps {
  userId: string;
  onExpenseCreated: (expense: ExpenseResponse) => void;
}

const INITIAL_VALUES: ExpenseFormValues = {
  amount: "",
  currency: "GTQ",
  merchantName: "",
};

export function ExpenseForm({ userId, onExpenseCreated }: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<ExpenseFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ExpenseResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kept per draft so retries of the same expense reuse the exact same Idempotency-Key.
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());
  const isSubmittingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    const errors = validateExpenseForm(values);
    setFieldErrors(errors);
    setApiError(null);

    if (hasValidationErrors(errors)) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setConfirmation(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const created = await createExpenseRequest(
        userId,
        idempotencyKeyRef.current,
        {
          amount: values.amount,
          currency: values.currency,
          merchantName: values.merchantName.trim(),
        },
        controller.signal,
      );

      setConfirmation(created);
      setValues(INITIAL_VALUES);
      setFieldErrors({});
      idempotencyKeyRef.current = crypto.randomUUID();
      onExpenseCreated(created);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (error instanceof ApiRequestError) {
        setApiError(error.message);
      } else {
        setApiError(
          "No se pudo conectar con el servidor. Puedes reintentar de forma segura.",
        );
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card" aria-label="Registrar nuevo gasto">
      <div className="card-body">
        <h2 className="h5 mb-3">Registrar nuevo gasto</h2>

        {apiError && (
          <div className="alert alert-danger" role="alert">
            {apiError}
          </div>
        )}

        {confirmation && (
          <div className="alert alert-success" role="status">
            <strong>Gasto registrado.</strong> Monto en GTQ:{" "}
            <strong>Q {confirmation.amountGtq}</strong> · Tasa aplicada:{" "}
            <strong>{confirmation.exchangeRateApplied}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="expense-amount" className="form-label">
                Monto
              </label>
              <input
                id="expense-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="200.00"
                className={`form-control ${fieldErrors.amount ? "is-invalid" : ""}`}
                value={values.amount}
                aria-invalid={Boolean(fieldErrors.amount)}
                aria-describedby={
                  fieldErrors.amount ? "expense-amount-error" : undefined
                }
                disabled={isSubmitting}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, amount: event.target.value }))
                }
              />
              {fieldErrors.amount && (
                <div id="expense-amount-error" className="invalid-feedback">
                  {fieldErrors.amount}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label htmlFor="expense-currency" className="form-label">
                Moneda
              </label>
              <select
                id="expense-currency"
                name="currency"
                className={`form-select ${fieldErrors.currency ? "is-invalid" : ""}`}
                value={values.currency}
                aria-invalid={Boolean(fieldErrors.currency)}
                aria-describedby={
                  fieldErrors.currency ? "expense-currency-error" : undefined
                }
                disabled={isSubmitting}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    currency: event.target.value as Currency,
                  }))
                }
              >
                <option value="GTQ">GTQ (Quetzales)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
              {fieldErrors.currency && (
                <div id="expense-currency-error" className="invalid-feedback">
                  {fieldErrors.currency}
                </div>
              )}
            </div>

            <div className="col-12">
              <label htmlFor="expense-merchant" className="form-label">
                Comercio
              </label>
              <input
                id="expense-merchant"
                name="merchantName"
                type="text"
                maxLength={120}
                placeholder="Hotel De confianza"
                className={`form-control ${fieldErrors.merchantName ? "is-invalid" : ""}`}
                value={values.merchantName}
                aria-invalid={Boolean(fieldErrors.merchantName)}
                aria-describedby={
                  fieldErrors.merchantName ? "expense-merchant-error" : undefined
                }
                disabled={isSubmitting}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    merchantName: event.target.value,
                  }))
                }
              />
              {fieldErrors.merchantName && (
                <div id="expense-merchant-error" className="invalid-feedback">
                  {fieldErrors.merchantName}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registrando..." : "Registrar gasto"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
