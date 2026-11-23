import type { DepartmentBudget } from "../types/api";

interface BudgetSummaryProps {
  budget: DepartmentBudget | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export function BudgetSummary({
  budget,
  isLoading,
  errorMessage,
}: BudgetSummaryProps) {
  return (
    <section className="mb-4" aria-label="Resumen de presupuesto">
      <h2 className="h5 mb-2">Presupuesto del departamento (GTQ)</h2>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered bg-white mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th scope="col">Total</th>
              <th scope="col">Reservado</th>
              <th scope="col">Disponible</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="fw-semibold">
                {isLoading || !budget ? "..." : `Q ${budget.totalGtq}`}
              </td>
              <td className="fw-semibold text-warning-emphasis">
                {isLoading || !budget ? "..." : `Q ${budget.reservedGtq}`}
              </td>
              <td className="fw-semibold text-success">
                {isLoading || !budget ? "..." : `Q ${budget.availableGtq}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
