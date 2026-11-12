import type { Locator, Page } from '@playwright/test';
import type { Credentials } from '../../api/models';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(private page: Page) {
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login-btn');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(credentials: Credentials): Promise<void> {
    await this.emailInput.fill(credentials.email);
    await this.passwordInput.fill(credentials.password);
    await this.loginButton.click();
  }
}
