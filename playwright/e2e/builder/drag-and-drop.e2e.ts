import { expect, test } from "@playwright/test";

import { setupOrganizationAndLoginAsMember } from "../../utils";
import { teardownOrganizationAndMember } from "~/test/test-utils";

const templateId = "resume-modern-professional";

test.describe("builder drag and drop interactions", () => {
  // Reset store state before each test to prevent state leakage
  test.beforeEach(async ({ page }) => {
    // Reset the Zustand store by navigating to a page that will reset it
    // The editor route resets selectedSectionId when loading a template
    await page.goto("/");
    // Wait a bit for any cleanup
    await page.waitForTimeout(100);
  });
  test("given: a logged in user, should: drag component from palette to empty canvas", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${templateId}`,
    );

    // Wait for template to load
    await expect(page.getByTestId("template-editor-title")).toContainText(
      /modern professional/i,
    );

    // Find a component in the palette (e.g., Skills component)
    // Use the palette-specific test ID to avoid matching canvas sections
    const skillsComponent = page.getByTestId("palette-skills");

    // Verify component is visible in palette
    await expect(skillsComponent).toBeVisible();

    // Count initial sections before drag using test IDs
    const sectionsBefore = page.locator('section[data-testid^="section-"]');
    const initialSectionCount = await sectionsBefore.count();

    // Get the canvas area (the droppable area)
    const canvas = page.getByTestId("canvas-droppable");
    await expect(canvas).toBeVisible();

    // Get bounding boxes for precise positioning
    const componentBox = await skillsComponent.boundingBox();
    const canvasBox = await canvas.boundingBox();

    if (!componentBox || !canvasBox) {
      throw new Error("Could not get bounding boxes for drag and drop");
    }

    // Use manual mouse events to properly trigger dnd-kit's pointer sensor
    // dnd-kit uses PointerSensor with activationConstraint: { distance: 5 }
    // Move to center of component, press, move to canvas, release
    await page.mouse.move(
      componentBox.x + componentBox.width / 2,
      componentBox.y + componentBox.height / 2,
    );
    await page.mouse.down();
    // Move more than 5px to trigger activation (dnd-kit requires 5px movement)
    await page.mouse.move(
      componentBox.x + componentBox.width / 2 + 10,
      componentBox.y + componentBox.height / 2 + 10,
      { steps: 5 },
    );
    // Move to top-left of canvas (empty area above sections, avoiding hitting section elements)
    // This ensures we drop on canvas-droppable, not on a section
    await page.mouse.move(canvasBox.x + 20, canvasBox.y + 20, { steps: 10 });
    await page.mouse.up();

    // Wait for drop status message to appear (confirms drop was detected)
    await expect(page.getByText(/draggable item.*was dropped/i)).toBeVisible({
      timeout: 2000,
    });

    // Wait for the section count to increase (React state update + re-render)
    const sectionsAfter = page.locator('section[data-testid^="section-"]');
    await expect(sectionsAfter).toHaveCount(initialSectionCount + 1, {
      timeout: 2000,
    });

    // Check that a new Skills section was added to the canvas
    // Find all Skills sections and verify at least one is on the canvas (not in palette)
    const skillsSections = page
      .getByTestId("canvas-droppable")
      .locator('[data-testid^="section-"]')
      .filter({ hasText: /technical skills|skills/i });
    await expect(skillsSections.first()).toBeVisible({ timeout: 2000 });

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: drag component from palette between existing sections", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${templateId}`,
    );

    // Wait for template to load
    await expect(page.getByText(/john doe/i)).toBeVisible({ timeout: 5000 });

    // Find the summary section using test ID (more reliable than text matching)
    const summarySections = page
      .getByTestId("canvas-droppable")
      .locator('[data-testid^="section-"]')
      .filter({ hasText: /summary/i });
    const summarySection = summarySections.first();
    await expect(summarySection).toBeVisible();

    // Find a component in the palette (e.g., Skills)
    // Use the palette-specific test ID to avoid matching canvas sections
    const skillsComponent = page.getByTestId("palette-skills");
    await expect(skillsComponent).toBeVisible();

    // Count initial sections before drag using test IDs
    const sectionsBefore = page.locator('section[data-testid^="section-"]');
    const initialSectionCount = await sectionsBefore.count();

    // Get bounding boxes for precise positioning
    const componentBox = await skillsComponent.boundingBox();
    const summaryBox = await summarySection.boundingBox();

    if (!componentBox || !summaryBox) {
      throw new Error("Could not get bounding boxes for drag and drop");
    }

    // Use manual mouse events to properly trigger dnd-kit's pointer sensor
    // This avoids pointer interception issues with dragTo()
    await page.mouse.move(
      componentBox.x + componentBox.width / 2,
      componentBox.y + componentBox.height / 2,
    );
    await page.mouse.down();
    // Move more than 5px to trigger activation
    await page.mouse.move(
      componentBox.x + componentBox.width / 2 + 10,
      componentBox.y + componentBox.height / 2 + 10,
      { steps: 5 },
    );
    // Move to top of summary section (to insert above it)
    await page.mouse.move(
      summaryBox.x + summaryBox.width / 2,
      summaryBox.y + 10,
      { steps: 10 },
    );
    await page.mouse.up();

    // Wait for drop status message to appear
    await expect(page.getByText(/draggable item.*was dropped/i)).toBeVisible({
      timeout: 2000,
    });

    // Wait for the section count to increase (React state update + re-render)
    const sectionsAfter = page.locator('section[data-testid^="section-"]');
    await expect(sectionsAfter).toHaveCount(initialSectionCount + 1, {
      timeout: 5000,
    });

    // Verify the component was added - check for Skills section on canvas
    const skillsSections = page
      .getByTestId("canvas-droppable")
      .locator('[data-testid^="section-"]')
      .filter({ hasText: /technical skills|skills/i });
    await expect(skillsSections.first()).toBeVisible({ timeout: 2000 });

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: reorder sections by dragging within canvas", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${templateId}`,
    );

    // Wait for template to load
    await expect(page.getByText(/john doe/i)).toBeVisible({ timeout: 5000 });

    // Wait for canvas to be ready
    const canvas = page.getByTestId("canvas-droppable");
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Find two sections using test IDs
    const headerSection = canvas
      .locator('[data-testid^="section-"]')
      .filter({ hasText: /john doe/i })
      .first();
    const summarySection = canvas
      .locator('[data-testid^="section-"]')
      .filter({ hasText: /summary/i })
      .first();

    await expect(headerSection).toBeVisible({ timeout: 5000 });
    await expect(summarySection).toBeVisible({ timeout: 5000 });

    // Scroll sections into view to ensure they're in the viewport
    await expect(async () => {
      await headerSection.scrollIntoViewIfNeeded();
      await summarySection.scrollIntoViewIfNeeded();
    }).toPass({ timeout: 2000 });
    await page.waitForTimeout(200); // Wait for scroll to complete

    // Get initial positions to verify order changed
    // Retry getting bounding boxes in case elements need to stabilize
    let initialHeaderBox = await headerSection.boundingBox();
    let initialSummaryBox = await summarySection.boundingBox();

    if (!initialHeaderBox || !initialSummaryBox) {
      // Retry after a short wait
      await page.waitForTimeout(300);
      initialHeaderBox = await headerSection.boundingBox();
      initialSummaryBox = await summarySection.boundingBox();
    }

    if (!initialHeaderBox || !initialSummaryBox) {
      throw new Error("Could not get bounding boxes for sections");
    }

    // Determine which section to drag based on initial order
    const headerIsAbove = initialHeaderBox.y < initialSummaryBox.y;
    const sectionToDrag = headerIsAbove ? summarySection : headerSection;
    const targetBox = headerIsAbove ? initialHeaderBox : initialSummaryBox;

    // Use the drag handle button for reordering (has listeners attached)
    // Get the section ID from the section's test ID
    const sectionToDragId = await sectionToDrag.getAttribute("data-testid");
    if (!sectionToDragId) {
      throw new Error("Could not get section test ID");
    }
    const sectionId = sectionToDragId.replace("section-", "");
    const dragHandle = sectionToDrag.getByTestId(
      `section-drag-handle-${sectionId}`,
    );
    await expect(dragHandle).toBeVisible();

    // Get drag handle position
    const dragHandleBox = await dragHandle.boundingBox();
    if (!dragHandleBox) {
      throw new Error("Could not get drag handle bounding box");
    }

    // Use manual mouse events to avoid pointer interception
    await page.mouse.move(
      dragHandleBox.x + dragHandleBox.width / 2,
      dragHandleBox.y + dragHandleBox.height / 2,
    );
    await page.mouse.down();
    // Move to trigger activation (dnd-kit requires 5px movement)
    await page.mouse.move(
      dragHandleBox.x + dragHandleBox.width / 2 + 10,
      dragHandleBox.y + dragHandleBox.height / 2 + 10,
      { steps: 5 },
    );
    // Move to center of target section to trigger reorder
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 10 },
    );
    await page.mouse.up();

    // Wait for drop status message to appear (confirms drop was detected)
    await expect(page.getByText(/draggable item.*was dropped/i)).toBeVisible({
      timeout: 2000,
    });

    // Wait for reorder to complete - verify the order actually changed
    // Use an assertion that waits for the condition rather than fixed timeout
    if (headerIsAbove) {
      // Summary was dragged above header, so summary should now be above
      await expect(async () => {
        const finalHeaderBox = await headerSection.boundingBox();
        const finalSummaryBox = await summarySection.boundingBox();
        if (!finalHeaderBox || !finalSummaryBox) {
          throw new Error("Could not get final bounding boxes");
        }
        expect(finalSummaryBox.y).toBeLessThan(finalHeaderBox.y);
      }).toPass({ timeout: 5000 });
    } else {
      // Header was dragged above summary, so header should now be above
      await expect(async () => {
        const finalHeaderBox = await headerSection.boundingBox();
        const finalSummaryBox = await summarySection.boundingBox();
        if (!finalHeaderBox || !finalSummaryBox) {
          throw new Error("Could not get final bounding boxes");
        }
        expect(finalHeaderBox.y).toBeLessThan(finalSummaryBox.y);
      }).toPass({ timeout: 5000 });
    }

    // Verify sections are still visible
    await expect(headerSection).toBeVisible();
    await expect(summarySection).toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: drag section to end of canvas", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${templateId}`,
    );

    // Wait for template to load
    await expect(page.getByText(/john doe/i)).toBeVisible({ timeout: 5000 });

    // Wait for canvas to be ready before finding sections
    const canvas = page.getByTestId("canvas-droppable");
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Find the header section using test IDs
    // Re-query the element to ensure it's attached to DOM
    const headerSection = canvas
      .locator('[data-testid^="section-"]')
      .filter({ hasText: /john doe/i })
      .first();
    await expect(headerSection).toBeVisible({ timeout: 5000 });

    // Scroll header section into view to ensure it's in the viewport
    // Use a retry mechanism in case element gets detached
    await expect(async () => {
      await headerSection.scrollIntoViewIfNeeded();
    }).toPass({ timeout: 2000 });
    await page.waitForTimeout(100); // Wait for scroll to complete

    // Get all sections to verify position at end
    const allSections = page
      .getByTestId("canvas-droppable")
      .locator('section[data-testid^="section-"]');
    const initialSectionCount = await allSections.count();

    // Get initial position of header section
    // Retry getting bounding box in case element needs to stabilize
    let initialHeaderBox = await headerSection.boundingBox();
    if (!initialHeaderBox) {
      // Retry after a short wait
      await page.waitForTimeout(200);
      initialHeaderBox = await headerSection.boundingBox();
    }
    if (!initialHeaderBox) {
      throw new Error("Could not get header section bounding box");
    }

    // Get the drag handle button for the header section
    const headerSectionId = await headerSection.getAttribute("data-testid");
    if (!headerSectionId) {
      throw new Error("Could not get header section test ID");
    }
    const sectionId = headerSectionId.replace("section-", "");
    const dragHandle = headerSection.getByTestId(
      `section-drag-handle-${sectionId}`,
    );
    await expect(dragHandle).toBeVisible();

    // Find the last section (bottom-most) to drop the header on it
    const sections = await allSections.all();
    let lastSection: (typeof sections)[number] | null = null;
    let lastSectionY = 0;

    for (const section of sections) {
      const sectionBox = await section.boundingBox();
      const sectionIdAttr = await section.getAttribute("data-testid");
      // Skip the header section itself
      if (
        sectionBox &&
        sectionIdAttr !== headerSectionId &&
        sectionBox.y > lastSectionY
      ) {
        lastSectionY = sectionBox.y;
        lastSection = section;
      }
    }

    if (!lastSection) {
      throw new Error("Could not find last section to drop on");
    }

    // Scroll the drag handle into view first (so we can interact with it)
    await dragHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Get drag handle position
    const updatedDragHandleBox = await dragHandle.boundingBox();
    if (!updatedDragHandleBox) {
      throw new Error("Could not get drag handle bounding box");
    }

    const dragHandleY =
      updatedDragHandleBox.y + updatedDragHandleBox.height / 2;
    const dragHandleX = updatedDragHandleBox.x + updatedDragHandleBox.width / 2;

    // Use manual mouse events - start at drag handle
    await page.mouse.move(dragHandleX, dragHandleY);
    await page.mouse.down();
    // Move to trigger activation (dnd-kit requires 5px movement)
    await page.mouse.move(dragHandleX, dragHandleY + 10, { steps: 5 });

    // Scroll down while dragging to reach the last section
    // Move in steps, scrolling as needed
    const viewportHeight = page.viewportSize()?.height || 800;
    let currentY = dragHandleY + 10;

    // Move down in increments, scrolling as we go
    for (let i = 0; i < 10; i++) {
      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 100));
      await page.waitForTimeout(50);
      // Move mouse down
      currentY += 50;
      await page.mouse.move(
        dragHandleX,
        Math.min(currentY, viewportHeight - 100),
        { steps: 3 },
      );
    }

    // Scroll to the bottom of the canvas and drop on empty canvas-droppable space
    // Dropping on canvas-droppable (not on a section) moves the item to the end
    // Re-query canvas to ensure it's still attached (use existing canvas variable)
    await canvas.scrollIntoViewIfNeeded();
    // Scroll to bottom of page to show bottom of canvas
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(200);

    // Get canvas bounding box at the bottom
    const finalCanvasBox = await canvas.boundingBox();
    if (finalCanvasBox) {
      // Drop at the bottom of canvas-droppable (empty space, not on a section)
      const targetDropX = finalCanvasBox.x + finalCanvasBox.width / 2;
      const targetDropY = finalCanvasBox.y + finalCanvasBox.height - 50; // Near bottom, within canvas
      await page.mouse.move(targetDropX, targetDropY, { steps: 5 });
    }

    // Wait to ensure hover is registered at drop position
    await page.waitForTimeout(200);
    await page.mouse.up();

    // Wait for drop to be processed (don't rely on status message for reordering)
    await page.waitForTimeout(500);

    // Verify header section is now at the end (below all other sections)
    await expect(async () => {
      const finalHeaderBox = await headerSection.boundingBox();
      if (!finalHeaderBox) {
        throw new Error("Could not get final header bounding box");
      }

      // Verify the position actually changed (moved down)
      if (finalHeaderBox.y <= initialHeaderBox.y) {
        throw new Error(
          `Header did not move down. Initial y: ${initialHeaderBox.y}, Final y: ${finalHeaderBox.y}`,
        );
      }

      // Verify header is below all other sections (is the last one)
      const currentSections = await allSections.all();
      for (const section of currentSections) {
        const sectionBox = await section.boundingBox();
        const sectionIdAttr = await section.getAttribute("data-testid");
        // Skip the header section itself
        if (sectionBox && sectionIdAttr !== headerSectionId) {
          // Header should be at or below other sections
          if (finalHeaderBox.y < sectionBox.y - 10) {
            throw new Error(
              `Header (y: ${finalHeaderBox.y}) is not at the end - section ${sectionIdAttr} is below it (y: ${sectionBox.y})`,
            );
          }
        }
      }
    }).toPass({ timeout: 5000 });

    // Verify section count hasn't changed (no sections were added/removed)
    await expect(allSections).toHaveCount(initialSectionCount);

    // Verify header section is still visible
    await expect(headerSection).toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user dragging a component, should: show visual feedback during drag", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${templateId}`,
    );

    // Wait for template to load
    await expect(page.getByTestId("template-editor-title")).toContainText(
      /modern professional/i,
    );

    // Find a component in the palette using test ID
    const skillsComponent = page.getByTestId("palette-skills");
    await expect(skillsComponent).toBeVisible();

    // Get component position for mouse events
    const componentBox = await skillsComponent.boundingBox();
    if (!componentBox) {
      throw new Error("Could not get skills component bounding box");
    }

    const componentX = componentBox.x + componentBox.width / 2;
    const componentY = componentBox.y + componentBox.height / 2;

    // Use manual mouse events to start dragging
    await page.mouse.move(componentX, componentY);
    await page.mouse.down();
    // Move to trigger activation (dnd-kit requires 5px movement)
    await page.mouse.move(componentX, componentY + 10, { steps: 5 });
    await page.waitForTimeout(10); // Small wait for activation

    // Check for drag overlay or visual feedback
    // The drag overlay should appear (target the span element, not accessibility text)
    const dragOverlay = page.locator('span:has-text("Dragging")').first();
    await expect(dragOverlay).toBeVisible({ timeout: 1000 });

    // Release the drag
    await page.mouse.up();

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: not add component when dragging outside valid drop zone", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${templateId}`,
    );

    // Wait for template to load
    await expect(page.getByTestId("template-editor-title")).toContainText(
      /modern professional/i,
    );

    // Count initial sections using test IDs
    const sectionsBefore = page.locator('section[data-testid^="section-"]');
    const initialSectionCount = await sectionsBefore.count();

    // Find a component in the palette
    // Use the palette-specific test ID to avoid matching canvas sections
    const skillsComponent = page.getByTestId("palette-skills");
    await expect(skillsComponent).toBeVisible();

    // Get bounding boxes for precise positioning
    const componentBox = await skillsComponent.boundingBox();
    const headerArea = page.getByTestId("template-editor-title");
    const headerBox = await headerArea.boundingBox();

    if (!componentBox || !headerBox) {
      throw new Error("Could not get bounding boxes for drag and drop");
    }

    // Use manual mouse events to drag to invalid location (outside canvas)
    await page.mouse.move(
      componentBox.x + componentBox.width / 2,
      componentBox.y + componentBox.height / 2,
    );
    await page.mouse.down();
    // Move to trigger activation (dnd-kit requires 5px movement)
    await page.mouse.move(
      componentBox.x + componentBox.width / 2 + 10,
      componentBox.y + componentBox.height / 2 + 10,
      { steps: 5 },
    );
    // Move to header area (invalid drop zone, outside canvas)
    await page.mouse.move(headerBox.x + 50, headerBox.y + 50, { steps: 10 });
    await page.mouse.up();

    // Wait a bit for any potential drop processing
    await page.waitForTimeout(500);

    // Verify section count hasn't increased (component wasn't added)
    const sectionsAfter = page.locator('section[data-testid^="section-"]');
    await expect(sectionsAfter).toHaveCount(initialSectionCount);

    // Verify the component palette still shows the component
    // (meaning it wasn't consumed by an invalid drop)
    await expect(skillsComponent).toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user, should: add multiple different components to template", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(
      `/organizations/${organization.slug}/builder/${templateId}`,
    );

    // Wait for template to load
    await expect(page.getByTestId("template-editor-title")).toContainText(
      /modern professional/i,
    );

    const canvas = page.getByTestId("canvas-droppable");

    // Count initial sections before drag
    const sectionsBefore = page.locator('section[data-testid^="section-"]');
    const initialSectionCount = await sectionsBefore.count();

    // Drag Skills component
    // Use the palette-specific test ID to avoid matching canvas sections
    const skillsComponent = page.getByTestId("palette-skills");
    await expect(skillsComponent).toBeVisible();

    // Get bounding boxes for precise positioning
    const skillsComponentBox = await skillsComponent.boundingBox();
    const canvasBox = await canvas.boundingBox();

    if (!skillsComponentBox || !canvasBox) {
      throw new Error("Could not get bounding boxes for drag and drop");
    }

    // Use manual mouse events to drag Skills component to canvas
    await page.mouse.move(
      skillsComponentBox.x + skillsComponentBox.width / 2,
      skillsComponentBox.y + skillsComponentBox.height / 2,
    );
    await page.mouse.down();
    // Move to trigger activation (dnd-kit requires 5px movement)
    await page.mouse.move(
      skillsComponentBox.x + skillsComponentBox.width / 2 + 10,
      skillsComponentBox.y + skillsComponentBox.height / 2 + 10,
      { steps: 5 },
    );
    // Move to canvas (empty area)
    await page.mouse.move(canvasBox.x + 20, canvasBox.y + 20, { steps: 10 });
    await page.mouse.up();

    // Wait for drop status message
    await expect(page.getByText(/draggable item.*was dropped/i)).toBeVisible({
      timeout: 2000,
    });

    // Wait for the section count to increase (React state update + re-render)
    const sectionsAfter = page.locator('section[data-testid^="section-"]');
    await expect(sectionsAfter).toHaveCount(initialSectionCount + 1, {
      timeout: 5000,
    });

    // Verify Skills section is visible on canvas (scoped to canvas only)
    const skillsSections = page
      .getByTestId("canvas-droppable")
      .locator('[data-testid^="section-"]')
      .filter({ hasText: /technical skills|skills/i });
    await expect(skillsSections.first()).toBeVisible({ timeout: 2000 });

    // Get updated section count after first drag
    const sectionsAfterFirst = page.locator('section[data-testid^="section-"]');
    const sectionCountAfterFirst = await sectionsAfterFirst.count();

    // Drag Summary component (if not already present)
    // Use the palette-specific test ID to avoid matching canvas sections
    const summaryComponent = page.getByTestId("palette-summary");

    // Only drag if it's in the palette (might already be on canvas)
    if (await summaryComponent.isVisible()) {
      const summaryComponentBox = await summaryComponent.boundingBox();
      const updatedCanvasBox = await canvas.boundingBox();

      if (summaryComponentBox && updatedCanvasBox) {
        // Use manual mouse events to drag Summary component to canvas
        await page.mouse.move(
          summaryComponentBox.x + summaryComponentBox.width / 2,
          summaryComponentBox.y + summaryComponentBox.height / 2,
        );
        await page.mouse.down();
        // Move to trigger activation
        await page.mouse.move(
          summaryComponentBox.x + summaryComponentBox.width / 2 + 10,
          summaryComponentBox.y + summaryComponentBox.height / 2 + 10,
          { steps: 5 },
        );
        // Move to canvas (empty area)
        await page.mouse.move(
          updatedCanvasBox.x + 20,
          updatedCanvasBox.y + 20,
          { steps: 10 },
        );
        await page.mouse.up();

        // Wait for drop status message
        await expect(
          page.getByText(/draggable item.*was dropped/i),
        ).toBeVisible({ timeout: 2000 });

        // Wait for the section count to increase
        const sectionsAfterSecond = page.locator(
          'section[data-testid^="section-"]',
        );
        console.log({ sectionsAfterSecond: await sectionsAfterSecond.all() });
        await expect(sectionsAfterSecond).toHaveCount(
          sectionCountAfterFirst + 1,
          { timeout: 5000 },
        );
      }
    }

    // Verify multiple sections are visible on canvas (scoped to canvas)
    await expect(
      page.getByTestId("canvas-droppable").getByText(/john doe/i),
    ).toBeVisible();
    // Use .first() to avoid strict mode violation when multiple Summary/Work Experience sections exist
    await expect(
      page
        .getByTestId("canvas-droppable")
        .getByText(/summary/i)
        .or(page.getByTestId("canvas-droppable").getByText(/work experience/i))
        .first(),
    ).toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });
});
