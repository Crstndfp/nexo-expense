import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { pool } from "../../config/db.js";
import { InsufficientDepartmentBudgetError } from "../../domain/errors.js";
import type { User } from "../../domain/types.js";
import { getDepartmentBudget } from "../../services/budgetService.js";
import { createExpense } from "../../services/expenseService.js";

const createdDepartmentIds: string[] = [];

async function seedIsolatedScenario(totalGtq: string): Promise<{
  departmentId: string;
  user: User;
}> {
  const suffix = randomUUID();
  const departmentId = `dept-test-${suffix}`;
  const userId = `usr-test-${suffix}`;

  await pool.query(
    `INSERT INTO departments (id, name, total_gtq, reserved_gtq, spent_gtq)
     VALUES ($1, $2, $3::numeric(14, 2), 0.00, 0.00)`,
    [departmentId, `Test Dept ${suffix}`, totalGtq],
  );

  await pool.query(
    `INSERT INTO users (id, name, role, department_id)
     VALUES ($1, $2, 'EMPLOYEE', $3)`,
    [userId, `Test User ${suffix}`, departmentId],
  );

  createdDepartmentIds.push(departmentId);

  return {
    departmentId,
    user: {
      id: userId,
      name: `Test User ${suffix}`,
      role: "EMPLOYEE",
      departmentId,
    },
  };
}

describe("expenseService integration (PostgreSQL concurrency & idempotency)", () => {
  afterAll(async () => {
    for (const deptId of createdDepartmentIds) {
      await pool.query("DELETE FROM expenses WHERE department_id = $1", [deptId]);
      await pool.query("DELETE FROM users WHERE department_id = $1", [deptId]);
      await pool.query("DELETE FROM departments WHERE id = $1", [deptId]);
    }
    await pool.end();
  });

  it("handles 5 simultaneous requests with the same Idempotency-Key creating only 1 expense", async () => {
    const { departmentId, user } = await seedIsolatedScenario("1000.00");
    const sharedKey = randomUUID();

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        createExpense({
          user,
          idempotencyKey: sharedKey,
          amount: "100.00",
          currency: "GTQ",
          merchantName: "Hotel Concurrencia",
        }),
      ),
    );

    const uniqueIds = new Set(results.map((expense) => expense.id));
    expect(uniqueIds.size).toBe(1);

    const countResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM expenses WHERE department_id = $1",
      [departmentId],
    );
    expect(countResult.rows[0]?.count).toBe("1");

    const budget = await getDepartmentBudget(departmentId);
    expect(budget).toEqual({
      departmentId,
      totalGtq: "1000.00",
      reservedGtq: "100.00",
      availableGtq: "900.00",
    });
  });

  it("handles 10 simultaneous 150.00 GTQ expenses against 1000.00 GTQ budget: 6 succeed, 4 fail", async () => {
    const { departmentId, user } = await seedIsolatedScenario("1000.00");

    const settled = await Promise.allSettled(
      Array.from({ length: 10 }, (_, index) =>
        createExpense({
          user,
          idempotencyKey: randomUUID(),
          amount: "150.00",
          currency: "GTQ",
          merchantName: `Comercio ${index + 1}`,
        }),
      ),
    );

    const fulfilled = settled.filter((r) => r.status === "fulfilled");
    const rejected = settled.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(6);
    expect(rejected).toHaveLength(4);

    for (const failure of rejected) {
      expect(failure.reason).toBeInstanceOf(InsufficientDepartmentBudgetError);
      expect((failure.reason as InsufficientDepartmentBudgetError).code).toBe(
        "INSUFFICIENT_DEPARTMENT_BUDGET",
      );
    }

    const countResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM expenses WHERE department_id = $1",
      [departmentId],
    );
    expect(countResult.rows[0]?.count).toBe("6");

    const budget = await getDepartmentBudget(departmentId);
    expect(budget).toEqual({
      departmentId,
      totalGtq: "1000.00",
      reservedGtq: "900.00",
      availableGtq: "100.00",
    });
  });
});
