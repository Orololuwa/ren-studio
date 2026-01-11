import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";

let browserInstance: Browser | null = null;

async function getBrowserInstance(): Promise<Browser> {
  // Check if browser exists and is still connected
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  // If browser is disconnected or doesn't exist, create a new one
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (error) {
      console.error("Error closing disconnected browser:", error);
    }
    browserInstance = null;
  }

  const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  };

  try {
    browserInstance = await puppeteer.launch(launchOptions);
    return browserInstance;
  } catch (error) {
    console.error("Failed to launch Puppeteer browser:", error);
    throw new Error(
      `Failed to launch browser: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function generatePDF(html: string): Promise<Buffer> {
  let browser: Browser | null = null;
  let page: Awaited<ReturnType<Browser["newPage"]>> | null = null;

  try {
    browser = await getBrowserInstance();
    page = await browser.newPage();

    // Use domcontentloaded instead of networkidle0 since we're not loading external resources
    // This prevents hanging and connection timeouts
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30_000, // 30 second timeout
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error in generatePDF:", error);
    // If connection error, reset browser instance
    if (
      error instanceof Error &&
      (error.message.includes("Connection closed") ||
        error.message.includes("Target closed") ||
        error.message.includes("Session closed"))
    ) {
      browserInstance = null;
    }
    throw error;
  } finally {
    if (page) {
      await page.close().catch((err) => {
        console.error("Error closing page:", err);
      });
    }
  }
}

export async function generateImage(
  html: string,
  options?: {
    width?: number;
    height?: number;
    format?: "png" | "jpeg";
  },
): Promise<Buffer> {
  let browser: Browser | null = null;
  let page: Awaited<ReturnType<Browser["newPage"]>> | null = null;

  try {
    browser = await getBrowserInstance();
    page = await browser.newPage();

    await page.setViewport({
      width: options?.width || 1200,
      height: options?.height || 1600,
    });

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const screenshot = await page.screenshot({
      type: options?.format || "png",
      fullPage: true,
    });

    return Buffer.from(screenshot);
  } catch (error) {
    console.error("Error in generateImage:", error);
    // If connection error, reset browser instance
    if (
      error instanceof Error &&
      (error.message.includes("Connection closed") ||
        error.message.includes("Target closed") ||
        error.message.includes("Session closed"))
    ) {
      browserInstance = null;
    }
    throw error;
  } finally {
    if (page) {
      await page.close().catch((err) => {
        console.error("Error closing page:", err);
      });
    }
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
