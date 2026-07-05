import { store } from "../store/store.js";
import { createApiError } from "../middleware/errorHandler.js";

export interface AppConfig {
  managerApprovalThreshold: number;
}

function isPositiveNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

export function getConfig(): AppConfig {
  return { managerApprovalThreshold: store.getManagerApprovalThreshold() };
}

export function updateConfig(input: { managerApprovalThreshold?: unknown }): AppConfig {
  const { managerApprovalThreshold } = input;
  if (!isPositiveNumber(managerApprovalThreshold)) {
    throw createApiError(400, "managerApprovalThreshold must be a positive number");
  }
  store.setManagerApprovalThreshold(managerApprovalThreshold);
  return getConfig();
}
