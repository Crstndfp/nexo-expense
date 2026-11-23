export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Revisa los datos enviados.",
    fields?: Record<string, string>,
  ) {
    super(400, "VALIDATION_ERROR", message, fields);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Se requiere un usuario autenticado válido.") {
    super(401, "UNAUTHENTICATED", message);
  }
}

export class InsufficientDepartmentBudgetError extends AppError {
  constructor(
    message = "El departamento no cuenta con saldo disponible suficiente.",
  ) {
    super(409, "INSUFFICIENT_DEPARTMENT_BUDGET", message);
  }
}
