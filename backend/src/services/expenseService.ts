import { withTransaction } from "../config/db.js";
import { InsufficientDepartmentBudgetError } from "../domain/errors.js";
import {
  convertToGtq,
  parseNonNegativeAmountToCents,
  type Currency,
} from "../domain/money.js";
import type { Expense, User } from "../domain/types.js";
import {
  findDepartmentByIdForUpdate,
  incrementDepartmentReserved,
} from "../repositories/departmentRepository.js";
import {
  findExpenseByIdempotencyKey,
  insertExpense,
} from "../repositories/expenseRepository.js";

export interface CreateExpenseCommand {
  user: User;
  idempotencyKey: string;
  amount: string;
  currency: Currency;
  merchantName: string;
}

export async function createExpense(
  command: CreateExpenseCommand,
): Promise<Expense> {
  const conversion = convertToGtq(command.amount, command.currency);

  return withTransaction(async (client) => {
    // Lock the department row first to serialize concurrent budget & idempotency checks.
    const department = await findDepartmentByIdForUpdate(
      command.user.departmentId,
      client,
    );
    if (!department) {
      throw new Error(`Department not found: ${command.user.departmentId}`);
    }

    const existing = await findExpenseByIdempotencyKey(
      command.user.id,
      command.idempotencyKey,
      client,
    );
    if (existing) {
      return existing;
    }

    const totalCents = parseNonNegativeAmountToCents(department.totalGtq);
    const reservedCents = parseNonNegativeAmountToCents(department.reservedGtq);
    const spentCents = parseNonNegativeAmountToCents(department.spentGtq);
    const availableCents = totalCents - reservedCents - spentCents;

    if (availableCents < conversion.amountGtqCents) {
      throw new InsufficientDepartmentBudgetError();
    }

    const created = await insertExpense(
      {
        creatorId: command.user.id,
        departmentId: department.id,
        idempotencyKey: command.idempotencyKey,
        originalAmount: conversion.originalAmount,
        originalCurrency: conversion.originalCurrency,
        exchangeRateApplied: conversion.exchangeRateApplied,
        amountGtq: conversion.amountGtq,
        merchantName: command.merchantName,
      },
      client,
    );

    await incrementDepartmentReserved(department.id, conversion.amountGtq, client);

    return created;
  });
}
