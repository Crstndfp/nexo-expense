import { Router } from "express";
import { UnauthenticatedError } from "../../domain/errors.js";
import { createExpense } from "../../services/expenseService.js";
import { validateCreateExpenseInput } from "../validators/expenseValidator.js";

export const expenseRouter = Router();

expenseRouter.post("/", async (req, res) => {
  if (!req.user) {
    throw new UnauthenticatedError();
  }

  const validated = validateCreateExpenseInput(
    req.header("Idempotency-Key"),
    req.body,
  );

  const expense = await createExpense({
    user: req.user,
    ...validated,
  });

  res.status(201).json(expense);
});
