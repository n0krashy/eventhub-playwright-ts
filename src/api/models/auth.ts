import type { ResponseBase } from './common';

export type Credentials = { email: string; password: string };

export type LoginResponse = ResponseBase & {
  token: string;
  user: { id: number; email: string };
};
