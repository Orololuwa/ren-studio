import { expect, test } from "@playwright/test";

import { setupOrganizationAndLoginAsMember } from "../../utils";
import { teardownOrganizationAndMember } from "~/test/test-utils";

const resumeTemplateId = "resume-modern-professional";
const invoiceTemplateId = "invoice-simple";

test.describe("builder advanced editor features", () => {
  // Reset store state before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(100);
  });

  test("given: a logged in user, should: delete a section from the canvas", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${resumeTemplateId}`,
    );

    // Wait for template to load
    await expect(page.getByTestId("template-editor-title")).toBeVisible();

    const sections = page.locator('section[data-testid^="section-"]');
    const initialCount = await sections.count();

    const firstSection = sections.first();
    const sectionId = (await firstSection.getAttribute("data-testid"))?.replace(
      "section-",
      "",
    );

    // Click delete button
    await page.getByTestId(`section-delete-${sectionId}`).click();

    // Verify count decreased
    await expect(sections).toHaveCount(initialCount - 1);

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: toggle section visibility", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${resumeTemplateId}`,
    );

    // Wait for template to load
    await expect(page.getByTestId("template-editor-title")).toBeVisible();

    const firstSection = page
      .locator('section[data-testid^="section-"]')
      .first();
    const sectionId = (await firstSection.getAttribute("data-testid"))?.replace(
      "section-",
      "",
    );

    // Check initial visibility (should not have low opacity)
    await expect(firstSection).not.toHaveClass(/opacity-60/);

    // Click visibility toggle
    await page.getByTestId(`section-visibility-toggle-${sectionId}`).click();

    // Verify visibility changed (should have low opacity or modified styling)
    await expect(firstSection).toHaveClass(/opacity-60/);

    // Toggle back
    await page.getByTestId(`section-visibility-toggle-${sectionId}`).click();
    await expect(firstSection).not.toHaveClass(/opacity-60/);

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: update template name via title click", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${resumeTemplateId}`,
    );

    // Wait for template to load
    const titleButton = page.getByTestId("template-editor-title");
    await expect(titleButton).toBeVisible();

    // Click title to edit
    await titleButton.click();

    // Verify inline editor opens (ID is based on label: "Template Name" -> "template-name")
    const editor = page.getByTestId("inline-editor-dialog-template-name");
    await expect(editor).toBeVisible();

    const input = page.getByTestId("inline-editor-input-template-name");
    await input.clear();
    await input.fill("New Awesome Template Name");
    await page.getByTestId("inline-editor-save-button").click();

    // Verify title updated
    await expect(titleButton).toHaveText("New Awesome Template Name");

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: update color palette", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${resumeTemplateId}`,
    );

    // Wait for template to load
    await expect(page.getByTestId("template-editor-title")).toBeVisible();

    // Open Settings dropdown
    await page.getByTestId("settings-button").click();
    // Click Color Palette menu item (opens the dialog)
    await page.getByRole("menuitem", { name: /color palette/i }).click();
    await expect(page.getByTestId("color-palette-description")).toBeVisible();

    // Change first color
    const firstColorInput = page.getByTestId("palette-input-0");
    await firstColorInput.clear();
    await firstColorInput.fill("#FF0000");
    await firstColorInput.blur(); // Trigger debounce/save

    // Verify color changed in input
    await expect(firstColorInput).toHaveValue("#FF0000");

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: switch currency for invoice templates", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${invoiceTemplateId}`,
    );

    // Wait for template to load
    await expect(page.getByTestId("template-editor-title")).toBeVisible();

    // Open Settings dropdown
    await page.getByTestId("settings-button").click();

    // Click on Currency submenu trigger to open the submenu
    // The trigger has "Currency" text and shows current currency
    const currencySubmenuTrigger = page
      .locator('[role="menuitem"]')
      .filter({ hasText: /currency/i })
      .first();
    await currencySubmenuTrigger.click();

    // Wait for the currency submenu (Command component) to appear
    // CommandItem uses data-slot="command-item" and contains the currency name
    // Also wait for the Command input to be visible as a sign the submenu is open
    await page.waitForSelector('[data-slot="command-item"]', { timeout: 3000 });
    await page.waitForSelector('input[placeholder*="Search currency"]', {
      timeout: 2000,
    });

    // Select Euro from the Command list using getByText which is more reliable
    // The currency name is "Euro (€)" - we can match just "Euro" or the full text
    const euroItem = page.getByText("Euro", { exact: false }).first();
    await expect(euroItem).toBeVisible({ timeout: 3000 });
    await euroItem.click();

    // Close any open dropdowns by pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Wait for the dropdown menu to be hidden (with a catch in case it's already closed)
    try {
      await page.waitForSelector('[role="menu"]', {
        state: "hidden",
        timeout: 2000,
      });
    } catch {
      // Menu might already be closed or selector might not exist, that's fine
    }

    // Wait a bit more to ensure any animations/transitions complete
    await page.waitForTimeout(300);

    // Reopen Settings dropdown to verify currency is updated
    const settingsButton = page.getByTestId("settings-button");
    await expect(settingsButton).toBeVisible();

    // Ensure button is not blocked by checking if it's in viewport and clickable
    await settingsButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    // Click the button
    await settingsButton.click();

    // Wait for dropdown to open
    await page.waitForSelector('[role="menu"]', {
      state: "visible",
      timeout: 2000,
    });

    // The currency submenu trigger should now show "€ EUR"
    const updatedCurrencyTrigger = page
      .locator('[role="menuitem"]')
      .filter({ hasText: /currency/i })
      .first();
    await expect(updatedCurrencyTrigger).toContainText("€ EUR");

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user making changes, should: trigger auto-save status", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${resumeTemplateId}`,
    );

    // Wait for template to load
    await expect(page.getByTestId("template-editor-title")).toBeVisible();

    // Initial status should be "Auto-save enabled" or similar
    const statusBadge = page.getByTestId("save-status-badge");
    await expect(statusBadge).toBeVisible();

    // Make a change (e.g., update template name)
    const titleButton = page.getByTestId("template-editor-title");
    await titleButton.click();
    const input = page.getByTestId("inline-editor-input-template-name");
    await input.fill("Auto-save Test");
    await page.getByTestId("inline-editor-save-button").click();

    // Wait for "Saving..." or "Saved" status to confirm change triggered auto-save
    await expect(statusBadge).toContainText(/saving|saved/i, { timeout: 5000 });

    // Ensure it eventually reaches "Saved"
    await expect(statusBadge).toContainText(/saved/i, { timeout: 10_000 });

    await teardownOrganizationAndMember({ organization, user });
  });
});
