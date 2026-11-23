export type Currency = "GTQ" | "USD";
export type UserRole = "EMPLOYEE" | "APPROVER";

export interface TestUser {
  id: string;
  name: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
}

export interface DepartmentBudget {
  departmentId: string;
  totalGtq: string;
  reservedGtq: string;
  availableGtq: string;
}

export interface CreateExpensePayload {
  amount: string;
  currency: Currency;
  merchantName: string;
}

export interface ExpenseResponse {
  id: string;
  creatorId: string;
  departmentId: string;
  status: string;
  originalAmount: string;
  originalCurrency: Currency;
  exchangeRateApplied: string;
  amountGtq: string;
  merchantName: string;
  createdAt: string;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
  };
}
