import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { setupOrganizationAndLoginAsMember } from "../../utils";
import {
  createTemplateInDatabase,
  deleteAllTemplatesForOrganization,
  deleteTemplateFromDatabase,
} from "~/features/templates/shared/templates-model.server";

test.describe("builder template selection page", () => {
  let organizationSlug: string;
  let organizationId: string;

  test.beforeEach(async ({ page }) => {
    const data = await setupOrganizationAndLoginAsMember({ page });
    organizationSlug = data.organization.slug;
    organizationId = data.organization.id;

    // Navigate to the template builder page
    await page.goto(`/organizations/${organizationSlug}/templates`);
    await page.waitForSelector('[data-testid="template-builder-heading"]');
  });

  test.afterEach(async () => {
    // Clean up: delete all templates created during the test
    // This includes templates created when opening default templates (customize mode)
    // and any templates created by auto-save
    await deleteAllTemplatesForOrganization(organizationId);
  });

  test("should display the default state correctly", async ({ page }) => {
    // Check heading and description
    await expect(page.getByTestId("template-builder-heading")).toBeVisible();
    await expect(
      page.getByTestId("template-builder-description"),
    ).toContainText("Choose a template");

    // Check default view tab
    await expect(page.getByTestId("tab-defaults")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Check that estimate template type button is active (default; resume is not in the sidebar)
    await expect(
      page.getByTestId("template-type-button-estimate"),
    ).toHaveAttribute("aria-current", "page");

    // Check that the expected estimate templates are present
    const visibleGrid = page.locator('[data-testid="template-grid"]:visible');

    await expect(
      visibleGrid.getByTestId("template-card-estimate-simple"),
    ).toBeVisible();

    await expect(
      visibleGrid.getByTestId("template-card-estimate-professional"),
    ).toBeVisible();
  });

  test("should switch between template types", async ({ page }) => {
    // Ensure we're starting from the estimate view (default)
    await expect(
      page.getByTestId("template-type-button-estimate"),
    ).toHaveAttribute("aria-current", "page");

    // Switch to Invoice via sidebar
    const invoiceButton = page.getByTestId("template-type-button-invoice");
    await expect(invoiceButton).toBeVisible();
    await invoiceButton.scrollIntoViewIfNeeded();
    await invoiceButton.click();

    // Wait for button to become active (indicates navigation happened)
    await expect(invoiceButton).toHaveAttribute("aria-current", "page", {
      timeout: 10_000,
    });

    // Verify URL updated
    await expect(page).toHaveURL(/type=invoice/);

    // Verify invoice templates are shown using template IDs
    const invoiceGrid = page.locator('[data-testid="template-grid"]:visible');
    await expect(
      invoiceGrid.getByTestId("template-card-invoice-simple"),
    ).toBeVisible();
    await expect(
      invoiceGrid.getByTestId("template-card-invoice-professional"),
    ).toBeVisible();

    // Switch to Receipt
    const receiptButton = page.getByTestId("template-type-button-receipt");
    await expect(receiptButton).toBeVisible();
    await receiptButton.scrollIntoViewIfNeeded();
    await receiptButton.click();

    // Wait for button to become active
    await expect(receiptButton).toHaveAttribute("aria-current", "page", {
      timeout: 10_000,
    });

    // Verify URL updated
    await expect(page).toHaveURL(/type=receipt/);

    // Verify receipt templates are shown using template IDs
    const receiptGrid = page.locator('[data-testid="template-grid"]:visible');
    await expect(
      receiptGrid.getByTestId("template-card-receipt-simple"),
    ).toBeVisible();
    await expect(
      receiptGrid.getByTestId("template-card-receipt-professional"),
    ).toBeVisible();
  });

  test("should collapse and expand the sidebar", async ({ page }) => {
    // Use a specific selector for the builder sidebar to avoid matching the app's main sidebar
    const collapseButton = page.getByTestId(
      "template-builder-collapse-sidebar-button",
    );

    // Find the sidebar by locating the aside that contains the button
    const sidebar = page.locator("aside").filter({
      has: collapseButton,
    });

    // Initial state: expanded
    await expect(sidebar).toHaveClass(/w-64/);
    await expect(collapseButton).toHaveAccessibleName(/collapse sidebar/i);

    // Collapse - ensure button is ready and clickable
    await expect(collapseButton).toBeVisible();
    await collapseButton.scrollIntoViewIfNeeded();

    // Click and wait for the icon to change (ChevronLeft -> ChevronRight)
    // This is more reliable than waiting for class changes
    await Promise.all([
      collapseButton.click(),
      // Wait for the icon to change by checking for ChevronRight (collapsed state)
      page.waitForFunction(
        () => {
          const button = document.querySelector(
            '[data-testid="template-builder-collapse-sidebar-button"]',
          );
          if (!button) return false;
          // Check if ChevronRight icon is present (collapsed state)
          return (
            button.querySelector('svg[class*="lucide-chevron-right"]') !== null
          );
        },
        { timeout: 5000 },
      ),
    ]);

    // Verify sidebar collapsed
    await expect(sidebar).toHaveClass(/w-12/, { timeout: 5000 });
    await expect(collapseButton).toHaveAccessibleName(/expand sidebar/i);

    // Expand - click again
    await Promise.all([
      collapseButton.click(),
      // Wait for the icon to change back (ChevronRight -> ChevronLeft)
      page.waitForFunction(
        () => {
          const button = document.querySelector(
            '[data-testid="template-builder-collapse-sidebar-button"]',
          );
          if (!button) return false;
          // Check if ChevronLeft icon is present (expanded state)
          return (
            button.querySelector('svg[class*="lucide-chevron-left"]') !== null
          );
        },
        { timeout: 5000 },
      ),
    ]);

    // Verify sidebar expanded
    await expect(sidebar).toHaveClass(/w-64/, { timeout: 5000 });
    await expect(collapseButton).toHaveAccessibleName(/collapse sidebar/i);
  });

  test("should switch between Defaults and Saved views", async ({ page }) => {
    // Switch to Saved
    await page.getByTestId("tab-saved").click();
    await expect(page).toHaveURL(/view=saved/);

    // Check for empty state message in Saved view
    await expect(page.getByTestId("no-templates-message")).toBeVisible();
    await expect(page.getByTestId("no-templates-message")).toContainText(
      "No saved templates yet",
    );

    // Switch back to Defaults
    await page.getByTestId("tab-defaults").click();
    await expect(page).toHaveURL(/view=defaults/);

    const activeGrid = page.locator(
      '[role="tabpanel"][data-state="active"] [data-testid="template-grid"]',
    );
    await expect(activeGrid).toBeVisible();
  });

  test("should navigate to builder when clicking customize", async ({
    page,
  }) => {
    // Ensure we're on the defaults tab (not saved)
    await expect(page.getByTestId("tab-defaults")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const customizeButton = page
      .locator('[data-testid^="template-customize-button-"]')
      .filter({ visible: true })
      .first();
    await expect(customizeButton).toBeVisible();

    const testId = await customizeButton.getAttribute("data-testid");
    const templateId = testId?.replace("template-customize-button-", "");

    expect(templateId).toBeDefined();

    // Click the button and wait for navigation to start
    await customizeButton.click();

    // Wait for the URL to change (initial navigation)
    await page.waitForURL(
      new RegExp(`/templates/${templateId}.*mode=customize`),
      {
        waitUntil: "commit",
        timeout: 10_000,
      },
    );

    // Wait for the redirect to complete (customize mode creates a new template and redirects)
    // The redirect goes to a different template ID with mode=edit
    await page.waitForURL(/\/templates\/([^/?]+)\?mode=edit/, {
      waitUntil: "commit",
      timeout: 10_000,
    });

    // Now wait for the editor page to fully load
    await expect(page.getByTestId("template-editor-title")).toBeVisible({
      timeout: 10_000,
    });

    // Verify we're in the builder editor by checking for the canvas
    await expect(page.getByTestId("template-canvas")).toBeVisible({
      timeout: 10_000,
    });

    // Optionally verify the component palette is visible (confirms editor is fully loaded)
    await expect(page.getByTestId("component-palette")).toBeVisible({
      timeout: 10_000,
    });
    // Note: Template cleanup is handled by afterEach hook
  });

  test("should display saved templates in the Saved tab", async ({ page }) => {
    const data = await setupOrganizationAndLoginAsMember({ page });
    const organizationSlug = data.organization.slug;
    const organizationId = data.organization.id;

    // Create saved templates in the database
    // Note: React Router v7 uses turbo-stream format for .data routes, making it
    // difficult to mock. Creating DB records is the most reliable approach.
    const createdTemplates = await Promise.all([
      createTemplateInDatabase({
        name: "My Custom Resume",
        type: "resume",
        organizationId,
        sections: [
          {
            id: "resume-header-1",
            type: "header",
            order: 0,
            data: {
              name: "John Doe",
              email: "john@example.com",
            },
            styles: {},
          },
        ],
        globalStyles: {
          backgroundColor: "#ffffff",
          fontFamily: "Arial, sans-serif",
        },
        colorPalette: ["#ffffff", "#000000"],
      }),
      createTemplateInDatabase({
        name: "My Custom Invoice",
        type: "invoice",
        organizationId,
        sections: [],
        globalStyles: {},
        colorPalette: [],
      }),
    ]);

    try {
      // Navigate directly to saved view (full page load, server-side render)
      await page.goto(
        `/organizations/${organizationSlug}/templates?type=resume&view=saved`,
      );

      // Wait for page to load
      await page.waitForSelector('[data-testid="template-builder-heading"]');

      // Wait for the Saved tab to be active
      const savedTab = page.getByTestId("tab-saved");
      await expect(savedTab).toHaveAttribute("aria-selected", "true");

      // Wait for the template grid to appear
      await page.waitForSelector('[data-testid="template-grid"]:visible', {
        timeout: 10_000,
      });

      // Verify saved templates are displayed
      const visibleGrid = page.locator('[data-testid="template-grid"]:visible');
      await expect(
        visibleGrid.getByTestId(`template-card-${createdTemplates[0].id}`),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        visibleGrid.getByTestId(
          `template-card-title-${createdTemplates[0].id}`,
        ),
      ).toContainText("My Custom Resume");

      // Verify the saved count badge
      await expect(page.getByTestId("tab-saved")).toContainText("Saved (1)");

      // Switch to invoice type
      await page.getByTestId("template-type-button-invoice").click();
      await page.waitForURL(/type=invoice/);

      // Wait for the template grid to update
      await page.waitForSelector('[data-testid="template-grid"]:visible', {
        timeout: 10_000,
      });

      // Verify invoice template is displayed
      const invoiceGrid = page.locator('[data-testid="template-grid"]:visible');
      await expect(
        invoiceGrid.getByTestId(`template-card-${createdTemplates[1].id}`),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        invoiceGrid.getByTestId(
          `template-card-title-${createdTemplates[1].id}`,
        ),
      ).toContainText("My Custom Invoice");
    } finally {
      // Clean up: delete created templates
      await Promise.all(
        createdTemplates.map((template) =>
          deleteTemplateFromDatabase({
            templateId: template.id,
            organizationId,
          }),
        ),
      );
    }
  });

  test("should pass accessibility checks", async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
