import type { TestUser } from "../types/api";

interface UserSelectorProps {
  users: readonly TestUser[];
  activeUserId: string;
  onChangeUser: (userId: string) => void;
}

export function UserSelector({
  users,
  activeUserId,
  onChangeUser,
}: UserSelectorProps) {
  return (
    <div className="card mb-4">
      <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h1 className="h4 mb-1">NexoExpense</h1>
        </div>
        <div className="d-flex flex-column" style={{ minWidth: "280px" }}>
          <label htmlFor="active-user-select" className="form-label small fw-semibold mb-1">
            Usuario activo
          </label>
          <select
            id="active-user-select"
            className="form-select"
            value={activeUserId}
            onChange={(event) => onChangeUser(event.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} — {user.departmentName} ({user.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
