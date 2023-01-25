import { Page } from '@playwright/test'
import { selectors } from "./selectors";

export const login = async (page: Page, username: string, password: string) => {
  await page.goto('/secure-remote-storage');

  await Promise.all([
    page.waitForNavigation(),
    page.locator(selectors.loginButton).click()
  ]);

  await page.fill(selectors.loginScreen.usernameField, username);
  await page.fill(selectors.loginScreen.passwordField, password);
  await page.click(selectors.loginScreen.submitButton);
}

export const authorize = async (page: Page) => {
  await login(page, "user1", "testuser123")
  await page.waitForSelector(selectors.logoutButton);
  // click the token message to close it and overcome potential overlapping problem
  await page.locator(selectors.tokenMessage).click()
};
