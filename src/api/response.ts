import type { APIResponse } from '@playwright/test';
import type { FieldError } from './models';

export type ApiResponse<Body> = { status: number; body: Body };

export async function toApiResponse<Body>(res: APIResponse): Promise<ApiResponse<Body>> {
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), body: body as Body };
}

/** Names of the fields the API complained about, e.g. ['quantity']. */
export function fieldsWithErrors(res: ApiResponse<{ details?: FieldError[] }>): string[] {
  return (res.body.details ?? []).map((detail) => detail.field);
}
