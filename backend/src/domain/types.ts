import type { Currency } from "./money.js";

export type UserRole = "EMPLOYEE" | "APPROVER";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  departmentId: string;
}

export interface DepartmentBudget {
  departmentId: string;
  totalGtq: string;
  reservedGtq: string;
  availableGtq: string;
}

export type ExpenseStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface Expense {
  id: string;
  creatorId: string;
  departmentId: string;
  status: ExpenseStatus;
  originalAmount: string;
  originalCurrency: Currency;
  exchangeRateApplied: string;
  amountGtq: string;
  merchantName: string;
  createdAt: string;
}
