-- NexoExpense — PostgreSQL Schema & Initial Seed (V2 + V1 extensible)
-- Compatible with PostgreSQL 13+ (uses built-in gen_random_uuid()).
-- Safe to re-run (idempotent DDL and seed).

BEGIN;

-- =============================================================================
-- 1. Departments
-- =============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id            TEXT           PRIMARY KEY,
    name          TEXT           NOT NULL,
    total_gtq     NUMERIC(14, 2) NOT NULL CHECK (total_gtq >= 0),
    reserved_gtq  NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (reserved_gtq >= 0),
    spent_gtq     NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (spent_gtq >= 0),
    CONSTRAINT chk_departments_budget_bounds CHECK (reserved_gtq + spent_gtq <= total_gtq)
);

-- =============================================================================
-- 2. Users
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE,
    password_hash TEXT,
    role          TEXT NOT NULL CHECK (role IN ('EMPLOYEE', 'APPROVER')),
    department_id TEXT NOT NULL REFERENCES departments(id)
);

CREATE INDEX IF NOT EXISTS idx_users_department_id ON users (department_id);

-- =============================================================================
-- 3. Sessions (optional V1 auth)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

-- =============================================================================
-- 4. Expenses
-- =============================================================================
CREATE TABLE IF NOT EXISTS expenses (
    id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id            TEXT           NOT NULL REFERENCES users(id),
    department_id         TEXT           NOT NULL REFERENCES departments(id),
    idempotency_key       UUID           NOT NULL,
    status                TEXT           NOT NULL DEFAULT 'PENDING_APPROVAL'
                                         CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    original_amount       NUMERIC(14, 2) NOT NULL CHECK (original_amount > 0),
    original_currency     TEXT           NOT NULL CHECK (original_currency IN ('GTQ', 'USD')),
    exchange_rate_applied NUMERIC(12, 6) NOT NULL CHECK (exchange_rate_applied > 0),
    amount_gtq            NUMERIC(14, 2) NOT NULL CHECK (amount_gtq > 0),
    merchant_name         VARCHAR(120)   NOT NULL CHECK (length(trim(merchant_name)) > 0),

    -- Optional V1 fields (nullable/defaulted for full V2 compatibility)
    category              TEXT           CHECK (category IS NULL OR category IN ('TRAVEL', 'MEALS', 'LODGING', 'EQUIPMENT')),
    description           TEXT,
    reimbursement_account TEXT,
    tax_id                TEXT,
    attachment_key        TEXT,
    requires_audit_review BOOLEAN        NOT NULL DEFAULT FALSE,
    decided_by            TEXT           REFERENCES users(id),
    decision_reason       TEXT,
    decided_at            TIMESTAMPTZ,

    created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_expenses_creator_idempotency UNIQUE (creator_id, idempotency_key),
    CONSTRAINT chk_expenses_no_self_decision   CHECK (decided_by IS NULL OR decided_by <> creator_id),
    CONSTRAINT chk_expenses_rejection_reason   CHECK (
        status <> 'REJECTED' OR length(trim(coalesce(decision_reason, ''))) >= 5
    )
);

CREATE INDEX IF NOT EXISTS idx_expenses_department_status  ON expenses (department_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_creator_created_at ON expenses (creator_id, created_at);

-- =============================================================================
-- 5. Expense Events (optional V1 async outbox / audit log)
-- =============================================================================
CREATE TABLE IF NOT EXISTS expense_events (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id   UUID        NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    event_type   TEXT        NOT NULL CHECK (event_type IN ('EXPENSE_APPROVED', 'EXPENSE_REJECTED')),
    payload      JSONB       NOT NULL,
    status       TEXT        NOT NULL DEFAULT 'PENDING'
                             CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expense_events_status ON expense_events (status);

-- =============================================================================
-- 6. Initial Seed Data
-- =============================================================================
INSERT INTO departments (id, name, total_gtq, reserved_gtq, spent_gtq) VALUES
    ('dept-eng',   'Ingeniería', 50000.00, 0.00, 0.00),
    ('dept-sales', 'Ventas',     20000.00, 0.00, 0.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, password_hash, role, department_id) VALUES
    ('usr_emp_ana',    'Ana Morales',  'ana.morales@nexoexpense.test',  NULL, 'EMPLOYEE', 'dept-eng'),
    ('usr_mgr_carlos', 'Carlos Ruiz',  'carlos.ruiz@nexoexpense.test',  NULL, 'APPROVER', 'dept-eng'),
    ('usr_mgr_sofia',  'Sofía Castro', 'sofia.castro@nexoexpense.test', NULL, 'APPROVER', 'dept-eng'),
    ('usr_emp_diego',  'Diego Pérez',  'diego.perez@nexoexpense.test',  NULL, 'EMPLOYEE', 'dept-sales')
ON CONFLICT (id) DO NOTHING;

COMMIT;
