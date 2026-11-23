import express from "express";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(express.json());
app.use("/api/v1", authMiddleware);

// Business routes will be mounted here in HU-04 and HU-05.

app.use(errorHandler);
