import { expect, type Page } from "@playwright/test";

export const DEMO = { email: "demo@beautybook.co.il", password: "demo1234", slug: "demo" };

export function uniqueId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** A random valid Israeli mobile number, so every run books as a new client. */
export function randomPhone() {
  return "05" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("אימייל").fill(email);
  await page.getByLabel("סיסמה").fill(password);
  await page.getByRole("button", { name: "התחברות" }).click();
  await page.waitForURL(/\/dashboard/);
}

/** Signs up, saves a test card and creates a business. Returns its slug and login. */
export async function signupOwner(page: Page, opts: { ref?: string } = {}) {
  const id = uniqueId();
  const email = `qa-${id}@test.local`;
  const password = "qa-password-1";
  const slug = `qa-${id}`;
  await page.goto(opts.ref ? `/signup?ref=${opts.ref}` : "/signup");
  await page.getByLabel("שם מלא").fill("בודקת QA 💅");
  await page.getByLabel("אימייל").fill(email);
  await page.getByLabel("סיסמה").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "יצירת חשבון" }).click();
  await page.waitForURL(/\/onboarding/);
  await page.getByLabel("שם העסק").fill(`סטודיו QA ${id}`);
  await page.getByLabel("כתובת הדף שלך").fill(slug);
  await page.getByLabel("טלפון העסק").fill("050-7654321");
  await page.locator('input[name="starter"]').first().check();
  await page.getByRole("button", { name: "יצירת העסק" }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText("העסק שלך באוויר")).toBeVisible();
  return { email, password, slug };
}

/** Books the first free slot of the first service on a public page as a guest. */
export async function bookAsGuest(page: Page, slug: string, client: { name: string; phone: string }) {
  await page.goto(`/b/${slug}/book`);
  const services = page.locator("section").first().getByRole("button");
  await services.first().click();
  const slot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  const time = (await slot.textContent())!.trim();
  await slot.click();
  await page.getByLabel("שם מלא").fill(client.name);
  await page.getByLabel("טלפון").fill(client.phone);
  await page.getByRole("button", { name: /שליחת בקשה לתור|קביעת התור/ }).click();
  await page.waitForURL(/\/a\/[^/?]+\?new=1/);
  return { url: page.url(), time };
}
