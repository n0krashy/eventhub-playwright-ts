export type FieldError = { field: string; message: string };

// Every response can carry these fields.
// When a call fails, `error` (and sometimes `details`) is filled in.
export type ResponseBase = {
  success: boolean;
  error?: string;
  details?: FieldError[];
};

export type MessageResponse = ResponseBase & { message?: string };
