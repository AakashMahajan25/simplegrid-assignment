export const PORT = Number(process.env.PORT) || 3000;
export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

// For manager to configure
export const MANAGER_APPROVAL_THRESHOLD = 50_000;
