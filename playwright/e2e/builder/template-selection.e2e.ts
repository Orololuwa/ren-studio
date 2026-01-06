import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { setupOrganizationAndLoginAsMember } from "../../utils";
import { teardownOrganizationAndMember } from "~/test/test-utils";

test.describe("builder template selection page", () => {
  test("given: a logged in user, should: show template builder page with tabs", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/builder`);

    // Verify page title and heading
    await expect(page).toHaveTitle(/template builder/i);
    await expect(page.getByTestId("template-builder-heading")).toBeVisible();

    // Verify description
    await expect(
      page.getByTestId("template-builder-description"),
    ).toBeVisible();

    // Verify Create New button exists
    await expect(page.getByTestId("create-new-button")).toBeVisible();

    // Verify tabs are visible
    await expect(page.getByTestId("tab-resume")).toBeVisible();
    await expect(page.getByTestId("tab-invoice")).toBeVisible();
    await expect(page.getByTestId("tab-certificate")).toBeVisible();
    await expect(page.getByTestId("tab-report-cards")).toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user on resume tab, should: show resume templates", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/builder`);

    // Resume tab should be active by default
    const resumeTab = page.getByTestId("tab-resume");
    await expect(resumeTab).toHaveAttribute("aria-selected", "true");

    // Wait for tabpanel to be visible and templates to load
    const resumeTabpanel = page.getByRole("tabpanel", { name: /resume/i });
    await expect(resumeTabpanel).toBeVisible();

    // Wait for template cards to be visible
    const templateGrid = resumeTabpanel.getByTestId("template-grid");
    await expect(templateGrid).toBeVisible({ timeout: 10_000 });

    // Verify template cards are displayed - find first card by test ID
    const firstCard = templateGrid
      .locator('[data-testid^="template-card-"]')
      .first();
    await expect(firstCard).toBeVisible();

    // Verify card has title
    const cardTitle = firstCard.locator(
      '[data-testid^="template-card-title-"]',
    );
    await expect(cardTitle).toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: switch between template type tabs", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/builder`);

    // Start on resume tab
    await expect(page.getByTestId("tab-resume")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Switch to invoice tab
    await page.getByTestId("tab-invoice").click();
    await expect(page.getByTestId("tab-invoice")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByTestId("tab-resume")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Switch to certificate tab
    await page.getByTestId("tab-certificate").click();
    await expect(page.getByTestId("tab-certificate")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Switch to report cards tab
    await page.getByTestId("tab-report-cards").click();
    await expect(page.getByTestId("tab-report-cards")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: show template details in cards", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/builder`);

    // Wait for templates to load
    const templateGrid = page.getByTestId("template-grid");
    await expect(templateGrid).toBeVisible({ timeout: 10_000 });

    // Get first template card
    const firstCard = templateGrid
      .locator('[data-testid^="template-card-"]')
      .first();
    await expect(firstCard).toBeVisible();

    // Verify card has template name
    const cardTitle = firstCard.locator(
      '[data-testid^="template-card-title-"]',
    );
    await expect(cardTitle).toBeVisible();
    await expect(cardTitle).not.toHaveText("");

    // Verify card has description
    const cardDescription = firstCard.locator(
      '[data-testid^="template-card-description-"]',
    );
    await expect(cardDescription).toBeVisible();

    // Verify card has Customize button
    const customizeButton = firstCard.locator(
      '[data-testid^="template-customize-button-"]',
    );
    await expect(customizeButton).toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: navigate to editor when clicking Customize button", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/builder`);

    // Wait for templates to load
    const templateGrid = page.getByTestId("template-grid");
    await expect(templateGrid).toBeVisible({ timeout: 10_000 });

    // Get first template card
    const firstCard = templateGrid
      .locator('[data-testid^="template-card-"]')
      .first();
    await expect(firstCard).toBeVisible();

    // Get the template name to verify we're on the right page
    const templateName = await firstCard
      .locator('[data-testid^="template-card-title-"]')
      .textContent();

    // Click Customize button
    const customizeButton = firstCard.locator(
      '[data-testid^="template-customize-button-"]',
    );
    await customizeButton.click();

    // Wait for the editor page to load by checking for a specific element
    // This is more reliable than waiting for URL change with client-side navigation
    await expect(page.getByTestId("template-editor-title")).toBeVisible({
      timeout: 10_000,
    });

    // Verify navigation to editor
    await expect(page).toHaveURL(
      new RegExp(`/organizations/${organization.slug}/builder/[^/]+$`),
    );

    // Verify template name matches
    await expect(page.getByTestId("template-editor-title")).toContainText(
      templateName || "",
    );

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: show Create New button that is clickable", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/builder`);

    const createNewButton = page.getByTestId("create-new-button");
    await expect(createNewButton).toBeVisible();
    await expect(createNewButton).toBeEnabled();

    // Click the button (it currently redirects, but we test it's clickable)
    await createNewButton.click();

    // Verify navigation occurred (currently redirects to builder page)
    await expect(page).toHaveURL(
      new RegExp(`/organizations/${organization.slug}/builder`),
    );

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: lack any automatically detectable accessibility issues", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/builder`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules("color-contrast")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await teardownOrganizationAndMember({ organization, user });
  });
});
