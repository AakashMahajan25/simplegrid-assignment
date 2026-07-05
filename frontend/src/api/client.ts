import type { CreatePOInput, Product, SerializedPO, Vendor } from "../types";

// Error thrown for any non-2xx response. Carries the server's `error`
// message (backend always responds { error: string }) and the status code,
// so callers can branch on status if needed and always have a display-ready message.
export interface ApiClientError extends Error {
  status: number;
}

function makeApiError(status: number, message: string): ApiClientError {
  const error = new Error(message) as ApiClientError;
  error.status = status;
  return error;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed with status ${res.status}`;
    throw makeApiError(res.status, message);
  }

  return data as T;
}

export function getProducts(): Promise<Product[]> {
  return request<Product[]>("/api/products");
}

export function getVendors(): Promise<Vendor[]> {
  return request<Vendor[]>("/api/vendors");
}

export function getPOs(): Promise<SerializedPO[]> {
  return request<SerializedPO[]>("/api/purchase-orders");
}

export function getPO(id: number): Promise<SerializedPO> {
  return request<SerializedPO>(`/api/purchase-orders/${id}`);
}

export function createPO(input: CreatePOInput): Promise<SerializedPO> {
  return request<SerializedPO>("/api/purchase-orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function approvePO(id: number, asManager: boolean): Promise<SerializedPO> {
  const query = asManager ? "?role=manager" : "";
  return request<SerializedPO>(`/api/purchase-orders/${id}/approve${query}`, {
    method: "POST",
  });
}

export function receivePO(id: number): Promise<SerializedPO> {
  return request<SerializedPO>(`/api/purchase-orders/${id}/receive`, {
    method: "POST",
  });
}

export function resetDb(): Promise<void> {
  return request<void>("/api/dev/reset", { method: "POST" });
}
