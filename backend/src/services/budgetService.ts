import {
  formatCentsToAmount,
  parseNonNegativeAmountToCents,
} from "../domain/money.js";
import type { DepartmentBudget } from "../domain/types.js";
import { findDepartmentById } from "../repositories/departmentRepository.js";

export async function getDepartmentBudget(
  departmentId: string,
): Promise<DepartmentBudget> {
  const department = await findDepartmentById(departmentId);
  if (!department) {
    throw new Error(`Department not found: ${departmentId}`);
  }

  const totalCents = parseNonNegativeAmountToCents(department.totalGtq);
  const reservedCents = parseNonNegativeAmountToCents(department.reservedGtq);
  const spentCents = parseNonNegativeAmountToCents(department.spentGtq);
  const availableCents = totalCents - reservedCents - spentCents;

  return {
    departmentId: department.id,
    totalGtq: formatCentsToAmount(totalCents),
    reservedGtq: formatCentsToAmount(reservedCents),
    availableGtq: formatCentsToAmount(availableCents),
  };
}
