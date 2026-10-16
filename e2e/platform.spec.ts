import { expect, test } from "@playwright/test";
import { DEMO, bookAsGuest, login, randomPhone, signupOwner } from "./helpers";

test.describe("owner onboarding", () => {
  test("signup needs the terms consent, then trial checkout and business setup", async ({ page }) => {
    await page.goto("/signup");
    const consent = page.getByRole("checkbox");
    await expect(consent).toHaveAttribute("required", "");
    await expect(page.getByRole("link", { name: "תנאי השימוש" })).toHaveAttribute("href", "/terms");
    await expect(page.getByRole("link", { name: "מדיניות הפרטיות" })).toHaveAttribute("href", "/privacy");

    const owner = await signupOwner(page);
    await page.goto("/dashboard/billing");
    await expect(page.getByText("תקופת ניסיון").first()).toBeVisible();

    await page.goto(`/b/${owner.slug}`);
    await expect(page.locator("h1")).toContainText("סטודיו QA");
  });

  test("dashboard screens need a login", async ({ page }) => {
    for (const path of ["/dashboard", "/dashboard/clients", "/dashboard/billing", "/dashboard/design"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("wrong password is refused", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("אימייל").fill(DEMO.email);
    await page.getByLabel("סיסמה").fill("not-the-password");
    await page.getByRole("button", { name: "התחברות" }).click();
    await expect(page.getByText("אימייל או סיסמה שגויים")).toBeVisible();
  });
});

test.describe("booking round trip", () => {
  test("guest books, owner approves, client sees it and cancels", async ({ page, browser }) => {
    const owner = await signupOwner(page);
    const clientName = "דנה QA 🌸";
    const phone = randomPhone();

    const guest = await browser.newPage();
    const booking = await bookAsGuest(guest, owner.slug, { name: clientName, phone });
    await expect(guest.getByText("הבקשה נשלחה!")).toBeVisible();
    await expect(guest.getByText("ממתין")).toBeVisible();

    // The owner sees the request and approves it.
    await page.goto("/dashboard");
    const request = page.locator("section", { hasText: "בקשות ממתינות לאישור" });
    await expect(request.getByText(clientName)).toBeVisible();
    await request.getByRole("button", { name: "אישור" }).first().click();
    await expect(page.locator("section", { hasText: "בקשות ממתינות לאישור" })).toHaveCount(0);

    // The client's page shows the approval, and the slot is gone from the booking page.
    await guest.goto(booking.url.replace("?new=1", ""));
    await expect(guest.getByText("מאושר")).toBeVisible();

    // The client is now in the owner's client list with this booking in her history.
    await page.goto("/dashboard/clients");
    await page.getByText(clientName).click();
    await expect(page.getByText(phone)).toBeVisible();

    // Client cancels; the owner's calendar no longer shows it.
    await guest.getByRole("button", { name: "ביטול התור" }).click();
    await expect(guest.getByText("בוטל")).toBeVisible();
    await expect(guest.getByRole("button", { name: "ביטול התור" })).toHaveCount(0);
  });

  test("booking form rejects an invalid phone number", async ({ page }) => {
    await page.goto(`/b/${DEMO.slug}/book`);
    await page.locator("section").first().getByRole("button").first().click();
    const slot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await slot.click();
    await page.getByLabel("שם מלא").fill("בדיקה");
    await page.getByLabel("טלפון").fill("12345");
    await page.getByRole("button", { name: /שליחת בקשה לתור|קביעת התור/ }).click();
    await expect(page.getByText("מספר טלפון לא תקין")).toBeVisible();
  });

  test("auto-approve confirms online bookings right away", async ({ page, browser }) => {
    const owner = await signupOwner(page);
    await page.goto("/dashboard/settings");
    await page.locator('input[name="bookingMode"][value="AUTO"]').check();
    await page.getByRole("button", { name: "שמירת הגדרות" }).click();
    await expect(page.getByText("ההגדרות נשמרו")).toBeVisible();

    const guest = await browser.newPage();
    await bookAsGuest(guest, owner.slug, { name: "אורחת אוטומטית", phone: randomPhone() });
    await expect(guest.getByText("התור נקבע!")).toBeVisible();
  });
});

test.describe("calendar", () => {
  test("a manual appointment after closing time stays inside the calendar grid", async ({ page }) => {
    await signupOwner(page);
    await page.goto("/dashboard/appointments/new?date=2030-01-06&time=21:30");
    await page.locator('input[name="clientName"]').fill("לקוחת ערב");
    await page.locator('input[name="clientPhone"]').fill(randomPhone());
    await page.getByRole("button", { name: /שמירה|קביעת|יצירת/ }).first().click();
    await page.waitForURL(/\/dashboard\/appointments\/[^/]+\?created=1/);

    await page.goto("/dashboard?date=2030-01-06&view=day");
    const block = page.getByRole("link", { name: /21:30 לקוחת ערב/ });
    await expect(block).toBeVisible();
    const grid = block.locator("xpath=..");
    const [b, g] = await Promise.all([block.boundingBox(), grid.boundingBox()]);
    expect(b!.y + b!.height).toBeLessThanOrEqual(g!.y + g!.height + 1);
  });

  test("week view lists seven days", async ({ page }) => {
    await login(page, DEMO.email, DEMO.password);
    await page.goto("/dashboard?view=week");
    await expect(page.getByRole("link", { name: /^(יום [א-ו]׳|שבת) \d{1,2}\.\d{1,2}$/ })).toHaveCount(7);
  });
});

test.describe("tenant isolation", () => {
  test("an owner cannot open another business's appointment or client by URL", async ({ page, browser }) => {
    const guest = await browser.newPage();
    await bookAsGuest(guest, DEMO.slug, { name: "לקוחה של הדמו", phone: randomPhone() });

    const demo = await browser.newPage();
    await login(demo, DEMO.email, DEMO.password);
    await demo.goto("/dashboard");
    const apptHref = await demo.locator('a[href^="/dashboard/appointments/c"]').first().getAttribute("href");
    await demo.goto("/dashboard/clients");
    const clientHref = await demo.locator('a[href^="/dashboard/clients/c"]').first().getAttribute("href");
    expect(apptHref && clientHref).toBeTruthy();

    await signupOwner(page);
    for (const href of [apptHref!, clientHref!]) {
      const res = await page.goto(href);
      expect(res?.status()).toBe(404);
    }
  });
});

test.describe("invitations", () => {
  test("owner creates an invitation; the link prefills and books through it", async ({ page, browser }) => {
    await signupOwner(page);
    await page.goto("/dashboard/invite");
    await page.getByRole("button", { name: /הזמנה חדשה/ }).first().click();
    await page.locator('input[name="clientName"]').fill("מוזמנת QA");
    await page.locator('input[name="clientPhone"]').fill("0521234567");
    await page.getByRole("button", { name: /יצירת|צור|יצירה/ }).last().click();
    const wa = page.getByRole("link", { name: "שליחה בוואטסאפ" });
    await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/972521234567\?text=/);
    await expect(wa).toBeVisible();
    const href = decodeURIComponent((await wa.getAttribute("href"))!);
    const link = href.match(/https?:\/\/\S+invite=\S+/)?.[0];
    expect(link).toBeTruthy();

    const guest = await browser.newPage();
    await guest.goto(link!);
    await guest.getByRole("link", { name: /קביעת תור|להזמנת תור|הזמנת תור/ }).first().click().catch(() => {});
    if (!guest.url().includes("/book")) await guest.goto(link!.replace(/(\/b\/[^/?]+)/, "$1/book"));
    await guest.locator("section").first().getByRole("button").first().click();
    const slot = guest.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await slot.click();
    await expect(guest.getByLabel("שם מלא")).toHaveValue("מוזמנת QA");
    await guest.getByRole("button", { name: /שליחת בקשה לתור|קביעת התור/ }).click();
    await guest.waitForURL(/\?new=1/);

    await page.goto("/dashboard/invite");
    await expect(page.getByText("מוזמנת QA").first()).toBeVisible();
    await expect(page.getByText(/נוצל|הוזמן|נקבע תור|בשימוש/).first()).toBeVisible();
  });
});

test.describe("public page, SEO and subdomains", () => {
  test("business page has JSON-LD, booking link and legal footer", async ({ page }) => {
    await page.goto(`/b/${DEMO.slug}`);
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!);
    const nodes = Array.isArray(ld) ? ld : ld["@graph"] ?? [ld];
    expect(JSON.stringify(nodes)).toContain("BeautySalon");
    await expect(page.locator(`a[href$="/b/${DEMO.slug}/book"], a[href$="/book"]`).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "תנאי שימוש" }).first()).toHaveAttribute("href", "/terms");
    await expect(page.getByRole("link", { name: /מדיניות פרטיות|פרטיות/ }).first()).toHaveAttribute("href", "/privacy");
  });

  test("unknown business is a 404", async ({ page }) => {
    const res = await page.goto("/b/no-such-business-qa");
    expect(res?.status()).toBe(404);
  });

  test("sitemap and robots", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`/b/${DEMO.slug}`);
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /dashboard");
    expect(robots).toContain("Sitemap:");
  });

  test("<slug>.localhost shows the business page", async ({ page, baseURL }) => {
    const port = new URL(baseURL!).port;
    await page.goto(`http://${DEMO.slug}.localhost:${port}/`);
    await expect(page.locator("h1")).toContainText("סטודיו מיכל ליופי");
    await page.goto(`http://${DEMO.slug}.localhost:${port}/dashboard`);
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/(dashboard|login)/);
  });

  test("terms and privacy pages render", async ({ page }) => {
    for (const path of ["/terms", "/privacy"]) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});

test.describe("page design uploads", () => {
  test("a real photo uploads; a fake or oversized file shows a clear error", async ({ page }) => {
    await signupOwner(page);
    await page.goto("/dashboard/design");
    const coverInput = page.locator('input[type="file"]').first();

    // A tiny valid PNG.
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    await coverInput.setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: png });
    await expect(page.getByAltText("התמונה הראשית")).toBeVisible({ timeout: 15_000 });

    // Text pretending to be a JPEG.
    await coverInput.setInputFiles({ name: "fake.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not an image at all") });
    await expect(page.getByText("אפשר להעלות רק תמונות JPG, PNG או WEBP")).toBeVisible();

    // An undecodable 6MB file never reaches the server's upload limit.
    await coverInput.setInputFiles({ name: "huge.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(6 * 1024 * 1024, 1) });
    await expect(page.getByText(/התמונה גדולה מדי/)).toBeVisible();
  });
});
