# Notas técnicas — NexoExpense

### Concurrencia e idempotencia
* En `backend/src/services/expenseService.ts` toda creación corre dentro de `withTransaction` (`backend/src/config/db.ts`), iniciando con `SELECT ... FOR UPDATE` sobre `departments` (`backend/src/repositories/departmentRepository.ts`) para serializar escrituras únicamente del mismo departamento sin bloquear otros departamentos.
* Dentro de ese bloqueo se consulta `findExpenseByIdempotencyKey` (`backend/src/repositories/expenseRepository.ts`) antes de validar saldo e insertar, por lo que 5 envíos simultáneos con la misma clave devuelven el mismo gasto y solo reservan una vez.
* Como defensa en profundidad en PostgreSQL (`db/init.sql`), se definieron `UNIQUE (creator_id, idempotency_key)` (alcance por usuario) y `CHECK (reserved_gtq + spent_gtq <= total_gtq)` para impedir saldos negativos a nivel de motor.
* Los cálculos de moneda y saldos usan enteros exactos con `BigInt` en `backend/src/domain/money.ts` (`(scaled + 500_000n) / 1_000_000n`), evitando errores de punto flotante IEEE 754 en el redondeo `HALF_UP`.
* **Alternativas descartadas:** bloqueos en memoria de Node.js (no funcionan al escalar a múltiples instancias) y bloqueo optimista con columna `version` y reintentos en aplicación (añade complejidad de *retry loops* bajo alta contención sin ventaja frente a `FOR UPDATE` por departamento).

### Misma `Idempotency-Key` con datos distintos
* **En la API:** guardaría un `request_hash` (SHA-256 del payload normalizado: `amount`, `currency`, `merchantName`) en la tabla `expenses`. Si llega una clave existente para el mismo usuario y el hash coincide, devuelvo `201` con el gasto original; si difiere, respondería `409` o `422` (`IDEMPOTENCY_KEY_CONFLICT`) para evitar enmascarar un error del cliente.
* **En el formulario (`frontend/src/components/ExpenseForm.tsx`):** mientras el usuario reintenta el mismo gasto tras un fallo de red o `500` sin editar campos, se reutiliza exactamente la misma `Idempotency-Key`. Si el usuario modifica cualquier dato del borrador tras un error, rotaría a un nuevo UUID porque representa una intención de gasto distinta; también se rota automáticamente tras un `201` o al cambiar de usuario (`key={activeUserId}` en `frontend/src/App.tsx`).

### Simplificaciones y transparencia
* La identidad se delega al encabezado `X-User-Id` (`backend/src/http/middlewares/authMiddleware.ts`) asumiendo un API Gateway/SSO interno; en producción nunca se confiaría en esa cabecera sin autenticación criptográfica (JWT firmado, mTLS o validación en red privada).
* El esquema y seed viven en un único `db/init.sql` idempotente (incluyendo columnas opcionales/nullable para facilitar futuras aprobaciones o listado sin romper V2); en producción se usarían migraciones versionadas incrementales.
* Para la resolución de esta prueba se utilizó apoyo de un asistente de IA en revisión de requerimientos, estructura base y generación de código, revisando y validando la lógica financiera, SQL y pruebas localmente.
