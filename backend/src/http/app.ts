import express from "express";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { budgetRouter } from "./routes/budgetRoutes.js";
import { expenseRouter } from "./routes/expenseRoutes.js";

export const app = express();

app.use(express.json());
app.use("/api/v1", authMiddleware);

app.use("/api/v1/budget", budgetRouter);
app.use("/api/v1/expenses", expenseRouter);

app.use(errorHandler);
