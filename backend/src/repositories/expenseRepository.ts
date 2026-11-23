import type { PoolClient } from "pg";
import type { Currency } from "../domain/money.js";
import type { Expense, ExpenseStatus } from "../domain/types.js";

interface ExpenseRow {
  id: string;
  creator_id: string;
  department_id: string;
  status: ExpenseStatus;
  original_amount: string;
  original_currency: Currency;
  exchange_rate_applied: string;
  amount_gtq: string;
  merchant_name: string;
  created_at: Date | string;
}

export interface InsertExpenseParams {
  creatorId: string;
  departmentId: string;
  idempotencyKey: string;
  originalAmount: string;
  originalCurrency: Currency;
  exchangeRateApplied: string;
  amountGtq: string;
  merchantName: string;
}

function mapExpenseRow(row: ExpenseRow): Expense {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();

  return {
    id: row.id,
    creatorId: row.creator_id,
    departmentId: row.department_id,
    status: row.status,
    originalAmount: row.original_amount,
    originalCurrency: row.original_currency,
    exchangeRateApplied: row.exchange_rate_applied,
    amountGtq: row.amount_gtq,
    merchantName: row.merchant_name,
    createdAt,
  };
}

export async function findExpenseByIdempotencyKey(
  creatorId: string,
  idempotencyKey: string,
  client: PoolClient,
): Promise<Expense | null> {
  const result = await client.query<ExpenseRow>(
    `SELECT id, creator_id, department_id, status, original_amount,
            original_currency, exchange_rate_applied, amount_gtq,
            merchant_name, created_at
     FROM expenses
     WHERE creator_id = $1 AND idempotency_key = $2`,
    [creatorId, idempotencyKey],
  );

  const row = result.rows[0];
  return row ? mapExpenseRow(row) : null;
}

export async function insertExpense(
  params: InsertExpenseParams,
  client: PoolClient,
): Promise<Expense> {
  const result = await client.query<ExpenseRow>(
    `INSERT INTO expenses (
       creator_id,
       department_id,
       idempotency_key,
       original_amount,
       original_currency,
       exchange_rate_applied,
       amount_gtq,
       merchant_name
     )
     VALUES ($1, $2, $3, $4::numeric(14, 2), $5, $6::numeric(12, 6), $7::numeric(14, 2), $8)
     RETURNING id, creator_id, department_id, status, original_amount,
               original_currency, exchange_rate_applied, amount_gtq,
               merchant_name, created_at`,
    [
      params.creatorId,
      params.departmentId,
      params.idempotencyKey,
      params.originalAmount,
      params.originalCurrency,
      params.exchangeRateApplied,
      params.amountGtq,
      params.merchantName,
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to insert expense");
  }

  return mapExpenseRow(row);
}
