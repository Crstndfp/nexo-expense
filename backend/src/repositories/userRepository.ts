import { pool } from "../config/db.js";
import type { User, UserRole } from "../domain/types.js";

interface UserRow {
  id: string;
  name: string;
  role: UserRole;
  department_id: string;
}

export async function findUserById(userId: string): Promise<User | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, name, role, department_id
     FROM users
     WHERE id = $1`,
    [userId],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    departmentId: row.department_id,
  };
}
