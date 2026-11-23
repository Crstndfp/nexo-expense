import type { TestUser } from "../types/api";

export const TEST_USERS: readonly TestUser[] = [
  {
    id: "usr_emp_ana",
    name: "Ana Morales",
    role: "EMPLOYEE",
    departmentId: "dept-eng",
    departmentName: "Ingeniería",
  },
  {
    id: "usr_mgr_carlos",
    name: "Carlos Ruiz",
    role: "APPROVER",
    departmentId: "dept-eng",
    departmentName: "Ingeniería",
  },
  {
    id: "usr_mgr_sofia",
    name: "Sofía Castro",
    role: "APPROVER",
    departmentId: "dept-eng",
    departmentName: "Ingeniería",
  },
  {
    id: "usr_emp_diego",
    name: "Diego Pérez",
    role: "EMPLOYEE",
    departmentId: "dept-sales",
    departmentName: "Ventas",
  },
] as const;
