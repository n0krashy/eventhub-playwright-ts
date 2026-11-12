import { request, type APIRequestContext } from '@playwright/test';
import { env } from '../config/env';

/**
 * Creates the HTTP client the API tests use.
 * This is the only place that adds the Authorization header, so tests never deal with tokens.
 *
 * Playwright needs the base URL to end with "/" and request paths to have no leading "/",
 * otherwise the "/api" part of the URL is dropped.
 */
export async function newApiContext(token?: string): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: `${env.apiUrl}/`,
    extraHTTPHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
