import 'dotenv/config';
import type { Credentials } from '../api/models';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env (locally) or add it as a GitHub secret (CI).`,
    );
  }
  return value;
}

export const env = {
  // "||" (not "??") so an empty value from CI falls back to the default too
  baseUrl: (process.env.BASE_URL || 'https://eventhub.rahulshettyacademy.com'),
  apiUrl: (process.env.API_URL || 'https://api.eventhub.rahulshettyacademy.com/api'),

  // where the web app keeps the login token in localStorage
  tokenStorageKey: 'eventhub_token',

  // getters, so credentials are only required when a run actually uses them
  get primary(): Credentials {
    return { email: requireEnv('EVENTHUB_EMAIL'), password: requireEnv('EVENTHUB_PASSWORD') };
  },
  get secondary(): Credentials {
    return { email: requireEnv('EVENTHUB_EMAIL_2'), password: requireEnv('EVENTHUB_PASSWORD_2') };
  },
};
