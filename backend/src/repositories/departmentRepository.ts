import type { PoolClient } from "pg";
import { pool } from "../config/db.js";

export interface DepartmentRecord {
  id: string;
  name: string;
  totalGtq: string;
  reservedGtq: string;
  spentGtq: string;
}

interface DepartmentRow {
  id: string;
  name: string;
  total_gtq: string;
  reserved_gtq: string;
  spent_gtq: string;
}

function mapDepartmentRow(row: DepartmentRow): DepartmentRecord {
  return {
    id: row.id,
    name: row.name,
    totalGtq: row.total_gtq,
    reservedGtq: row.reserved_gtq,
    spentGtq: row.spent_gtq,
  };
}

export async function findDepartmentById(
  departmentId: string,
  client?: PoolClient,
): Promise<DepartmentRecord | null> {
  const executor = client ?? pool;
  const result = await executor.query<DepartmentRow>(
    `SELECT id, name, total_gtq, reserved_gtq, spent_gtq
     FROM departments
     WHERE id = $1`,
    [departmentId],
  );

  const row = result.rows[0];
  return row ? mapDepartmentRow(row) : null;
}

export async function findDepartmentByIdForUpdate(
  departmentId: string,
  client: PoolClient,
): Promise<DepartmentRecord | null> {
  const result = await client.query<DepartmentRow>(
    `SELECT id, name, total_gtq, reserved_gtq, spent_gtq
     FROM departments
     WHERE id = $1
     FOR UPDATE`,
    [departmentId],
  );

  const row = result.rows[0];
  return row ? mapDepartmentRow(row) : null;
}

export async function incrementDepartmentReserved(
  departmentId: string,
  amountGtq: string,
  client: PoolClient,
): Promise<void> {
  await client.query(
    `UPDATE departments
     SET reserved_gtq = reserved_gtq + $1::numeric(14, 2)
     WHERE id = $2`,
    [amountGtq, departmentId],
  );
}
