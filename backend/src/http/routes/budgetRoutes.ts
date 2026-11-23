import { Router } from "express";
import { UnauthenticatedError } from "../../domain/errors.js";
import { getDepartmentBudget } from "../../services/budgetService.js";

export const budgetRouter = Router();

budgetRouter.get("/", async (req, res) => {
  if (!req.user) {
    throw new UnauthenticatedError();
  }

  const budget = await getDepartmentBudget(req.user.departmentId);
  res.status(200).json(budget);
});
