import type { NextFunction, Request, Response } from "express";

export interface ApiError extends Error {
  statusCode: number;
}

export function createApiError(statusCode: number, message: string): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  return error;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof Error && typeof (err as ApiError).statusCode === "number";
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (isApiError(err)) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
