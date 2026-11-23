import type {
  ApiErrorBody,
  CreateExpensePayload,
  DepartmentBudget,
  ExpenseResponse,
} from "../types/api";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

async function parseErrorResponse(response: Response): Promise<ApiRequestError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    const code = body.error?.code ?? "REQUEST_ERROR";
    const message =
      body.error?.message ?? "No se pudo completar la solicitud.";
    return new ApiRequestError(response.status, code, message);
  } catch {
    return new ApiRequestError(
      response.status,
      "REQUEST_ERROR",
      "Ocurrió un error al comunicarse con el servidor.",
    );
  }
}

export async function fetchDepartmentBudget(
  userId: string,
  signal?: AbortSignal,
): Promise<DepartmentBudget> {
  const response = await fetch("/api/v1/budget", {
    method: "GET",
    headers: {
      "X-User-Id": userId,
    },
    signal,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return (await response.json()) as DepartmentBudget;
}

export async function createExpenseRequest(
  userId: string,
  idempotencyKey: string,
  payload: CreateExpensePayload,
  signal?: AbortSignal,
): Promise<ExpenseResponse> {
  const response = await fetch("/api/v1/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return (await response.json()) as ExpenseResponse;
}
