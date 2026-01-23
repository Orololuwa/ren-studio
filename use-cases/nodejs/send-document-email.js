import "dotenv/config";
import nodemailer from "nodemailer";

const {
  API_KEY,
  API_BASE_URL,
  TEMPLATE_ID,
  EMAIL_PROVIDER = "mailgun", // mailgun, resend, sendgrid, or smtp
  EMAIL_TO,
  EMAIL_FROM,
  // Mailgun
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN,
  // Resend
  RESEND_API_KEY,
  // SendGrid
  SENDGRID_API_KEY,
  // SMTP (Nodemailer)
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_SECURE = "true", // true/false as string
} = process.env;

// Validate common required environment variables
const commonRequired = {
  API_KEY,
  API_BASE_URL,
  TEMPLATE_ID,
  EMAIL_TO,
  EMAIL_FROM,
};

const missingCommon = Object.entries(commonRequired)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingCommon.length > 0) {
  console.error("❌ Missing required environment variables:");
  for (const varName of missingCommon) {
    console.error(`  - ${varName}`);
  }
  process.exit(1);
}

// Validate provider-specific variables
function validateProviderConfig() {
  switch (EMAIL_PROVIDER) {
    case "mailgun":
      if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
        throw new Error(
          "Missing Mailgun config: MAILGUN_API_KEY and MAILGUN_DOMAIN are required",
        );
      }
      break;
    case "resend":
      if (!RESEND_API_KEY) {
        throw new Error("Missing Resend config: RESEND_API_KEY is required");
      }
      break;
    case "sendgrid":
      if (!SENDGRID_API_KEY) {
        throw new Error(
          "Missing SendGrid config: SENDGRID_API_KEY is required",
        );
      }
      break;
    case "smtp":
      if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
        throw new Error(
          "Missing SMTP config: SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD are required",
        );
      }
      break;
    default:
      throw new Error(
        `Invalid EMAIL_PROVIDER: ${EMAIL_PROVIDER}. Must be one of: mailgun, resend, sendgrid, smtp`,
      );
  }
}

/**
 * Calls the export API endpoint to generate a PDF
 * @returns {Promise<Buffer>} PDF buffer
 */
async function exportDocument() {
  const url = `${API_BASE_URL}/api/v1/templates/${TEMPLATE_ID}/export`;

  console.log(`📄 Exporting document from: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sections: {},
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Export API failed: ${response.status} ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`,
    );
  }

  const pdfBuffer = Buffer.from(await response.arrayBuffer());
  console.log(`✅ PDF generated successfully (${pdfBuffer.length} bytes)`);

  return pdfBuffer;
}

/**
 * Sends an email with PDF attachment via Mailgun
 * @param {Buffer} pdfBuffer - The PDF file buffer
 */
async function sendViaMailgun(pdfBuffer) {
  const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

  console.log(`📧 Sending email via Mailgun to: ${EMAIL_TO}`);

  const formData = new FormData();
  formData.append("from", EMAIL_FROM);
  formData.append("to", EMAIL_TO);
  formData.append("subject", "Your Document Export");
  formData.append(
    "text",
    "Please find your exported document attached to this email.",
  );
  formData.append(
    "html",
    "<p>Please find your exported document attached to this email.</p>",
  );

  const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
  formData.append("attachment", pdfBlob, "document.pdf");

  const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Mailgun API failed: ${response.status} ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`,
    );
  }

  const result = await response.json();
  console.log(`✅ Email sent successfully!`);
  console.log(`   Message ID: ${result.id || result.message || "N/A"}`);

  return result;
}

/**
 * Sends an email with PDF attachment via Resend
 * @param {Buffer} pdfBuffer - The PDF file buffer
 */
async function sendViaResend(pdfBuffer) {
  const url = "https://api.resend.com/emails";

  console.log(`📧 Sending email via Resend to: ${EMAIL_TO}`);

  // Convert PDF to base64 for Resend
  const pdfBase64 = pdfBuffer.toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: "Your Document Export",
      text: "Please find your exported document attached to this email.",
      html: "<p>Please find your exported document attached to this email.</p>",
      attachments: [
        {
          filename: "document.pdf",
          content: pdfBase64,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Resend API failed: ${response.status} ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`,
    );
  }

  const result = await response.json();
  console.log(`✅ Email sent successfully!`);
  console.log(`   Message ID: ${result.id || "N/A"}`);

  return result;
}

/**
 * Sends an email with PDF attachment via SendGrid
 * @param {Buffer} pdfBuffer - The PDF file buffer
 */
async function sendViaSendGrid(pdfBuffer) {
  const url = "https://api.sendgrid.com/v3/mail/send";

  console.log(`📧 Sending email via SendGrid to: ${EMAIL_TO}`);

  // Convert PDF to base64 for SendGrid
  const pdfBase64 = pdfBuffer.toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: EMAIL_TO }],
        },
      ],
      from: { email: EMAIL_FROM },
      subject: "Your Document Export",
      content: [
        {
          type: "text/plain",
          value: "Please find your exported document attached to this email.",
        },
        {
          type: "text/html",
          value:
            "<p>Please find your exported document attached to this email.</p>",
        },
      ],
      attachments: [
        {
          content: pdfBase64,
          filename: "document.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `SendGrid API failed: ${response.status} ${response.statusText}\n${errorText}`,
    );
  }

  console.log(`✅ Email sent successfully!`);
  console.log(`   Status: ${response.status} ${response.statusText}`);

  return { success: true };
}

/**
 * Sends an email with PDF attachment via SMTP (Nodemailer)
 * @param {Buffer} pdfBuffer - The PDF file buffer
 */
async function sendViaSMTP(pdfBuffer) {
  console.log(`📧 Sending email via SMTP to: ${EMAIL_TO}`);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number.parseInt(SMTP_PORT, 10),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: "Your Document Export",
    text: "Please find your exported document attached to this email.",
    html: "<p>Please find your exported document attached to this email.</p>",
    attachments: [
      {
        filename: "document.pdf",
        content: pdfBuffer,
      },
    ],
  });

  console.log(`✅ Email sent successfully!`);
  console.log(`   Message ID: ${info.messageId}`);

  return info;
}

/**
 * Sends an email with PDF attachment using the configured provider
 * @param {Buffer} pdfBuffer - The PDF file buffer
 */
async function sendEmailWithAttachment(pdfBuffer) {
  switch (EMAIL_PROVIDER) {
    case "mailgun":
      return await sendViaMailgun(pdfBuffer);
    case "resend":
      return await sendViaResend(pdfBuffer);
    case "sendgrid":
      return await sendViaSendGrid(pdfBuffer);
    case "smtp":
      return await sendViaSMTP(pdfBuffer);
    default:
      throw new Error(`Unsupported email provider: ${EMAIL_PROVIDER}`);
  }
}

/**
 * Main function to export document and send via email
 */
async function main() {
  try {
    console.log("🚀 Starting document export and email process...\n");
    console.log(`📮 Using email provider: ${EMAIL_PROVIDER.toUpperCase()}\n`);

    // Validate provider configuration
    validateProviderConfig();

    // Step 1: Export document
    const pdfBuffer = await exportDocument();

    // Step 2: Send email with attachment
    await sendEmailWithAttachment(pdfBuffer);

    console.log("\n✨ Process completed successfully!");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
