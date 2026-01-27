export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  pdfFilename?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends an email with PDF attachment via Mailgun
 * @param options - Email sending options
 * @returns Result with success status and message ID or error
 */
export async function sendEmailViaMailgun(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const {
    from,
    to,
    subject,
    html,
    pdfBuffer,
    pdfFilename = "document.pdf",
  } = options;

  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;

  if (!mailgunApiKey || !mailgunDomain) {
    return {
      success: false,
      error:
        "Mailgun configuration missing. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.",
    };
  }

  const url = `https://api.mailgun.net/v3/${mailgunDomain}/messages`;

  try {
    // Create FormData for multipart/form-data request
    const formData = new FormData();
    formData.append("from", from);
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("html", html);

    // Convert HTML to plain text for text version
    const textVersion = html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
    formData.append("text", textVersion || "Please see attached document.");

    // Add PDF attachment
    // In Node.js 18+, we can use File for FormData attachments
    // Convert Buffer to Uint8Array for File constructor compatibility
    const pdfFile = new File([new Uint8Array(pdfBuffer)], pdfFilename, {
      type: "application/pdf",
    });
    formData.append("attachment", pdfFile);

    // Create Basic Auth header
    const auth = Buffer.from(`api:${mailgunApiKey}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        `Mailgun API failed: ${response.status} ${response.statusText}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    const result = await response.json();
    const messageId = result.id || result.message || undefined;

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: `Failed to send email: ${errorMessage}`,
    };
  }
}
