# NexoExpense

Aplicación web y API para el registro de gastos de viaje en **GTQ** y **USD** contra el presupuesto de cada departamento, con aritmética monetaria exacta (`BigInt` + redondeo `HALF_UP`), control de concurrencia e idempotencia.

## Requisitos previos

* **Node.js 20+**
* **pnpm** (`npm i -g pnpm`)
* **PostgreSQL 13+** ejecutándose localmente

## Variables de entorno

Copia `.env.example` a `.env` en la raíz del proyecto y ajusta tus credenciales locales de PostgreSQL:

```bash
cp .env.example .env
```

Variables necesarias (ver `.env.example`):
* `DATABASE_URL`: cadena de conexión a PostgreSQL (ej. `postgresql://usuario:password@localhost:5432/nexo_expense`).
* `PORT`: puerto HTTP del backend (por defecto `3000`).

## 1. Base de datos y datos iniciales (seed)

Crea la base de datos `nexo_expense` en tu instancia local de PostgreSQL y aplica el esquema + seed:

```bash
createdb nexo_expense
psql -d nexo_expense -f db/init.sql
```

Si no tienes `psql` instalado, puedes aplicar `db/init.sql` con Node desde `backend/` (después de instalar dependencias):

```bash
cd backend
node --env-file=../.env -e "import('node:fs').then(async ({ readFileSync }) => { const { Client } = await import('pg'); const client = new Client({ connectionString: process.env.DATABASE_URL }); await client.connect(); await client.query(readFileSync('../db/init.sql', 'utf8')); await client.end(); console.log('Seed aplicado'); })"
```

## 2. Instalar dependencias

```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

## 3. Ejecutar en desarrollo

En una terminal (API en `http://localhost:3000`):

```bash
cd backend
pnpm dev
```

En otra terminal (Frontend en `http://localhost:5173`, con proxy `/api` hacia el backend):

```bash
cd frontend
pnpm dev
```

## 4. Ejecutar pruebas y verificación de tipos

Desde `backend/`:

```bash
pnpm typecheck
pnpm test
```

* **Prueba unitaria:** `backend/src/tests/unit/money.test.ts` (conversión USD/GTQ con redondeo comercial `HALF_UP` y casos límite).
* **Prueba de integración:** `backend/src/tests/integration/expenseService.test.ts` (concurrencia e idempotencia contra PostgreSQL llamando directo a la capa de servicios con departamentos y usuarios aislados `dept-test-<uuid>`).

Desde `frontend/`:

```bash
pnpm typecheck
pnpm build
```

## Tiempo invertido

* **Versión actual (V2):** ~5 horas (análisis de requerimientos y modelo de datos, backend + pruebas unitarias/integración y frontend en React). *(Ajusta este dato si dedicaste otro tiempo exacto antes de entregar).*
