import type { NextFunction, Request, Response } from "express";
import { UnauthenticatedError } from "../../domain/errors.js";
import type { User } from "../../domain/types.js";
import { findUserById } from "../../repositories/userRepository.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.header("X-User-Id")?.trim();
  if (!userId) {
    throw new UnauthenticatedError();
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new UnauthenticatedError();
  }

  req.user = user;
  next();
}
