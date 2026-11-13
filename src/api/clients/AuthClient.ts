import type { APIRequestContext } from '@playwright/test';
import type { Credentials, LoginResponse } from '../models/auth';
import { toApiResponse } from '../response';

export class AuthClient {
  constructor(private request: APIRequestContext) {}

  async login(credentials: Credentials) {
    const res = await this.request.post('auth/login', { data: credentials });
    return toApiResponse<LoginResponse>(res);
  }

  async register(credentials: Credentials) {
    const res = await this.request.post('auth/register', { data: credentials });
    return toApiResponse<LoginResponse>(res);
  }
}
