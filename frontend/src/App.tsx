import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, fetchDepartmentBudget } from "./api/nexoApi";
import { BudgetSummary } from "./components/BudgetSummary";
import { ExpenseForm } from "./components/ExpenseForm";
import { UserSelector } from "./components/UserSelector";
import { TEST_USERS } from "./constants/users";
import type { DepartmentBudget } from "./types/api";

export function App() {
  const [activeUserId, setActiveUserId] = useState<string>(TEST_USERS[0].id);
  const [budget, setBudget] = useState<DepartmentBudget | null>(null);
  const [isLoadingBudget, setIsLoadingBudget] = useState<boolean>(true);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    setBudget(null);
    setBudgetError(null);
    setIsLoadingBudget(true);

    fetchDepartmentBudget(activeUserId, controller.signal)
      .then((data) => {
        setBudget(data);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (error instanceof ApiRequestError) {
          setBudgetError(error.message);
        } else {
          setBudgetError("No se pudo cargar el presupuesto del departamento.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingBudget(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [activeUserId, refreshTick]);

  const handleUserChange = useCallback((nextUserId: string) => {
    setActiveUserId(nextUserId);
  }, []);

  const handleExpenseCreated = useCallback(() => {
    setRefreshTick((tick) => tick + 1);
  }, []);

  return (
    <main className="container py-4" style={{ maxWidth: "760px" }}>
      <UserSelector
        users={TEST_USERS}
        activeUserId={activeUserId}
        onChangeUser={handleUserChange}
      />

      <BudgetSummary
        budget={budget}
        isLoading={isLoadingBudget}
        errorMessage={budgetError}
      />

      {/* key={activeUserId} garantiza reinicio total del formulario y nueva Idempotency-Key */}
      <ExpenseForm
        key={activeUserId}
        userId={activeUserId}
        onExpenseCreated={handleExpenseCreated}
      />
    </main>
  );
}
