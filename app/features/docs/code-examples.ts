export type EmailProvider = "mailgun" | "resend" | "sendgrid" | "smtp";
export type Language =
  | "csharp"
  | "curl"
  | "go"
  | "java"
  | "node"
  | "php"
  | "python"
  | "ruby";

export function getCodeExample(
  language: Language,
  provider: EmailProvider,
): string {
  switch (language) {
    case "node":
      return getNodeExample(provider);
    case "curl":
      return getCurlExample(provider);
    case "python":
      return getPythonExample(provider);
    case "php":
      return getPhpExample(provider);
    case "go":
      return getGoExample(provider);
    case "java":
      return getJavaExample(provider);
    case "ruby":
      return getRubyExample(provider);
    case "csharp":
      return getCSharpExample(provider);
    default:
      return "";
  }
}

function getNodeExample(provider: EmailProvider): string {
  const baseCode = `import "dotenv/config";
import nodemailer from "nodemailer";

const {
  API_KEY,
  API_BASE_URL,
  TEMPLATE_ID,
  EMAIL_PROVIDER = "${provider}",
  EMAIL_TO,
  EMAIL_FROM,
} = process.env;

async function exportDocument() {
  const url = \`\${API_BASE_URL}/api/v1/templates/\${TEMPLATE_ID}/export\`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sections: {} }),
  });

  if (!response.ok) {
    throw new Error(\`Export failed: \${response.status}\`);
  }

  return Buffer.from(await response.arrayBuffer());
}`;

  switch (provider) {
    case "mailgun":
      return `${baseCode}

async function sendViaMailgun(pdfBuffer) {
  const formData = new FormData();
  formData.append("from", EMAIL_FROM);
  formData.append("to", EMAIL_TO);
  formData.append("subject", "Your Document Export");
  formData.append("text", "Please find your document attached.");
  formData.append("html", "<p>Please find your document attached.</p>");
  
  const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
  formData.append("attachment", pdfBlob, "document.pdf");
  
  const auth = Buffer.from(\`api:\${process.env.MAILGUN_API_KEY}\`).toString("base64");
  
  const response = await fetch(
    \`https://api.mailgun.net/v3/\${process.env.MAILGUN_DOMAIN}/messages\`,
    {
      method: "POST",
      headers: { Authorization: \`Basic \${auth}\` },
      body: formData,
    }
  );
  
  if (!response.ok) throw new Error("Mailgun API failed");
  return await response.json();
}

async function main() {
  const pdfBuffer = await exportDocument();
  await sendViaMailgun(pdfBuffer);
}

main();`;

    case "resend":
      return `${baseCode}

async function sendViaResend(pdfBuffer) {
  const pdfBase64 = pdfBuffer.toString("base64");
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${process.env.RESEND_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: "Your Document Export",
      text: "Please find your document attached.",
      html: "<p>Please find your document attached.</p>",
      attachments: [{ filename: "document.pdf", content: pdfBase64 }],
    }),
  });
  
  if (!response.ok) throw new Error("Resend API failed");
  return await response.json();
}

async function main() {
  const pdfBuffer = await exportDocument();
  await sendViaResend(pdfBuffer);
}

main();`;

    case "sendgrid":
      return `${baseCode}

async function sendViaSendGrid(pdfBuffer) {
  const pdfBase64 = pdfBuffer.toString("base64");
  
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${process.env.SENDGRID_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: EMAIL_TO }] }],
      from: { email: EMAIL_FROM },
      subject: "Your Document Export",
      content: [
        { type: "text/plain", value: "Please find your document attached." },
        { type: "text/html", value: "<p>Please find your document attached.</p>" },
      ],
      attachments: [{
        content: pdfBase64,
        filename: "document.pdf",
        type: "application/pdf",
        disposition: "attachment",
      }],
    }),
  });
  
  if (!response.ok) throw new Error("SendGrid API failed");
  return { success: true };
}

async function main() {
  const pdfBuffer = await exportDocument();
  await sendViaSendGrid(pdfBuffer);
}

main();`;

    case "smtp":
      return `${baseCode}

async function sendViaSMTP(pdfBuffer) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return await transporter.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: "Your Document Export",
    text: "Please find your document attached.",
    html: "<p>Please find your document attached.</p>",
    attachments: [{ filename: "document.pdf", content: pdfBuffer }],
  });
}

async function main() {
  const pdfBuffer = await exportDocument();
  await sendViaSMTP(pdfBuffer);
}

main();`;

    default:
      return baseCode;
  }
}

function getCurlExample(provider: EmailProvider): string {
  const exportCode = `# Export document
curl -X POST "https://your-api-url.com/api/v1/templates/your-template-id/export" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"sections": {}}' \\
  --output document.pdf`;

  switch (provider) {
    case "mailgun":
      return `${exportCode}

# Send via Mailgun
curl -X POST "https://api.mailgun.net/v3/YOUR_DOMAIN/messages" \\
  -u "api:YOUR_MAILGUN_API_KEY" \\
  -F "from=YOUR_EMAIL" \\
  -F "to=RECIPIENT_EMAIL" \\
  -F "subject=Your Document Export" \\
  -F "text=Please find your document attached." \\
  -F "attachment=@document.pdf"`;

    case "resend":
      return `${exportCode}

# Send via Resend
curl -X POST "https://api.resend.com/emails" \\
  -H "Authorization: Bearer YOUR_RESEND_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "YOUR_EMAIL",
    "to": "RECIPIENT_EMAIL",
    "subject": "Your Document Export",
    "text": "Please find your document attached.",
    "attachments": [{
      "filename": "document.pdf",
      "content": "'"$(base64 document.pdf)"'"
    }]
  }'`;

    case "sendgrid":
      return `${exportCode}

# Send via SendGrid
curl -X POST "https://api.sendgrid.com/v3/mail/send" \\
  -H "Authorization: Bearer YOUR_SENDGRID_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "personalizations": [{"to": [{"email": "RECIPIENT_EMAIL"}]}],
    "from": {"email": "YOUR_EMAIL"},
    "subject": "Your Document Export",
    "content": [
      {"type": "text/plain", "value": "Please find your document attached."}
    ],
    "attachments": [{
      "content": "'"$(base64 document.pdf)"'",
      "filename": "document.pdf",
      "type": "application/pdf"
    }]
  }'`;

    case "smtp":
      return `${exportCode}

# Send via SMTP (using sendmail or similar)
# Note: For SMTP, you'll need a mail client or library
# Example using sendmail:
sendmail -f YOUR_EMAIL RECIPIENT_EMAIL < <(
  echo "Subject: Your Document Export"
  echo "From: YOUR_EMAIL"
  echo "To: RECIPIENT_EMAIL"
  echo "MIME-Version: 1.0"
  echo "Content-Type: multipart/mixed; boundary=boundary123"
  echo ""
  echo "--boundary123"
  echo "Content-Type: text/plain"
  echo ""
  echo "Please find your document attached."
  echo "--boundary123"
  echo "Content-Type: application/pdf"
  echo "Content-Disposition: attachment; filename=document.pdf"
  echo ""
  cat document.pdf
  echo "--boundary123--"
)`;

    default:
      return exportCode;
  }
}

function getPythonExample(provider: EmailProvider): string {
  const baseCode = `import os
import requests
import base64

API_KEY = os.getenv("API_KEY")
API_BASE_URL = os.getenv("API_BASE_URL")
TEMPLATE_ID = os.getenv("TEMPLATE_ID")
EMAIL_TO = os.getenv("EMAIL_TO")
EMAIL_FROM = os.getenv("EMAIL_FROM")

def export_document():
    url = f"{API_BASE_URL}/api/v1/templates/{TEMPLATE_ID}/export"
    response = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={"sections": {}},
    )
    response.raise_for_status()
    return response.content`;

  switch (provider) {
    case "mailgun":
      return `${baseCode}

def send_via_mailgun(pdf_buffer):
    import requests
    
    url = f"https://api.mailgun.net/v3/{os.getenv('MAILGUN_DOMAIN')}/messages"
    files = {"attachment": ("document.pdf", pdf_buffer, "application/pdf")}
    data = {
        "from": EMAIL_FROM,
        "to": EMAIL_TO,
        "subject": "Your Document Export",
        "text": "Please find your document attached.",
    }
    auth = ("api", os.getenv("MAILGUN_API_KEY"))
    
    response = requests.post(url, auth=auth, files=files, data=data)
    response.raise_for_status()
    return response.json()

if __name__ == "__main__":
    pdf_buffer = export_document()
    send_via_mailgun(pdf_buffer)`;

    case "resend":
      return `${baseCode}

def send_via_resend(pdf_buffer):
    import requests
    
    pdf_base64 = base64.b64encode(pdf_buffer).decode("utf-8")
    
    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {os.getenv('RESEND_API_KEY')}",
            "Content-Type": "application/json",
        },
        json={
            "from": EMAIL_FROM,
            "to": EMAIL_TO,
            "subject": "Your Document Export",
            "text": "Please find your document attached.",
            "attachments": [{"filename": "document.pdf", "content": pdf_base64}],
        },
    )
    response.raise_for_status()
    return response.json()

if __name__ == "__main__":
    pdf_buffer = export_document()
    send_via_resend(pdf_buffer)`;

    case "sendgrid":
      return `${baseCode}

def send_via_sendgrid(pdf_buffer):
    import requests
    
    pdf_base64 = base64.b64encode(pdf_buffer).decode("utf-8")
    
    response = requests.post(
        "https://api.sendgrid.com/v3/mail/send",
        headers={
            "Authorization": f"Bearer {os.getenv('SENDGRID_API_KEY')}",
            "Content-Type": "application/json",
        },
        json={
            "personalizations": [{"to": [{"email": EMAIL_TO}]}],
            "from": {"email": EMAIL_FROM},
            "subject": "Your Document Export",
            "content": [
                {"type": "text/plain", "value": "Please find your document attached."}
            ],
            "attachments": [{
                "content": pdf_base64,
                "filename": "document.pdf",
                "type": "application/pdf",
                "disposition": "attachment",
            }],
        },
    )
    response.raise_for_status()
    return {"success": True}

if __name__ == "__main__":
    pdf_buffer = export_document()
    send_via_sendgrid(pdf_buffer)`;

    case "smtp":
      return `${baseCode}

def send_via_smtp(pdf_buffer):
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.base import MIMEBase
    from email import encoders
    
    msg = MIMEMultipart()
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO
    msg["Subject"] = "Your Document Export"
    msg.attach(MIMEText("Please find your document attached.", "plain"))
    
    part = MIMEBase("application", "octet-stream")
    part.set_payload(pdf_buffer)
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", "attachment; filename=document.pdf")
    msg.attach(part)
    
    server = smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT", "587")))
    if os.getenv("SMTP_SECURE") == "true":
        server.starttls()
    server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD"))
    server.send_message(msg)
    server.quit()

if __name__ == "__main__":
    pdf_buffer = export_document()
    send_via_smtp(pdf_buffer)`;

    default:
      return baseCode;
  }
}

function getPhpExample(provider: EmailProvider): string {
  const baseCode = `<?php

$apiKey = getenv("API_KEY");
$apiBaseUrl = getenv("API_BASE_URL");
$templateId = getenv("TEMPLATE_ID");
$emailTo = getenv("EMAIL_TO");
$emailFrom = getenv("EMAIL_FROM");

function exportDocument() {
    global $apiKey, $apiBaseUrl, $templateId;
    
    $url = "$apiBaseUrl/api/v1/templates/$templateId/export";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $apiKey",
        "Content-Type: application/json",
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["sections" => []]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Export failed: $httpCode");
    }
    
    return $response;
}`;

  switch (provider) {
    case "mailgun":
      return `${baseCode}

function sendViaMailgun($pdfBuffer) {
    global $emailFrom, $emailTo;
    
    $domain = getenv("MAILGUN_DOMAIN");
    $apiKey = getenv("MAILGUN_API_KEY");
    
    $ch = curl_init("https://api.mailgun.net/v3/$domain/messages");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_USERPWD, "api:$apiKey");
    
    $postData = [
        "from" => $emailFrom,
        "to" => $emailTo,
        "subject" => "Your Document Export",
        "text" => "Please find your document attached.",
    ];
    
    $cfile = new CURLFile("data://application/pdf;base64," . base64_encode($pdfBuffer), "application/pdf", "document.pdf");
    $postData["attachment"] = $cfile;
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

$pdfBuffer = exportDocument();
sendViaMailgun($pdfBuffer);
?>`;

    case "resend":
      return `${baseCode}

function sendViaResend($pdfBuffer) {
    global $emailFrom, $emailTo;
    
    $apiKey = getenv("RESEND_API_KEY");
    $pdfBase64 = base64_encode($pdfBuffer);
    
    $ch = curl_init("https://api.resend.com/emails");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $apiKey",
        "Content-Type: application/json",
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "from" => $emailFrom,
        "to" => $emailTo,
        "subject" => "Your Document Export",
        "text" => "Please find your document attached.",
        "attachments" => [["filename" => "document.pdf", "content" => $pdfBase64]],
    ]));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

$pdfBuffer = exportDocument();
sendViaResend($pdfBuffer);
?>`;

    case "sendgrid":
      return `${baseCode}

function sendViaSendGrid($pdfBuffer) {
    global $emailFrom, $emailTo;
    
    $apiKey = getenv("SENDGRID_API_KEY");
    $pdfBase64 = base64_encode($pdfBuffer);
    
    $ch = curl_init("https://api.sendgrid.com/v3/mail/send");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $apiKey",
        "Content-Type: application/json",
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "personalizations" => [["to" => [["email" => $emailTo]]]],
        "from" => ["email" => $emailFrom],
        "subject" => "Your Document Export",
        "content" => [["type" => "text/plain", "value" => "Please find your document attached."]],
        "attachments" => [[
            "content" => $pdfBase64,
            "filename" => "document.pdf",
            "type" => "application/pdf",
            "disposition" => "attachment",
        ]],
    ]));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return ["success" => true];
}

$pdfBuffer = exportDocument();
sendViaSendGrid($pdfBuffer);
?>`;

    case "smtp":
      return `${baseCode}

function sendViaSMTP($pdfBuffer) {
    global $emailFrom, $emailTo;
    
    require_once "vendor/autoload.php";
    use PHPMailer\\PHPMailer\\PHPMailer;
    use PHPMailer\\PHPMailer\\Exception;
    
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = getenv("SMTP_HOST");
    $mail->SMTPAuth = true;
    $mail->Username = getenv("SMTP_USER");
    $mail->Password = getenv("SMTP_PASSWORD");
    $mail->SMTPSecure = getenv("SMTP_SECURE") === "true" ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = intval(getenv("SMTP_PORT") ?: "587");
    
    $mail->setFrom($emailFrom);
    $mail->addAddress($emailTo);
    $mail->Subject = "Your Document Export";
    $mail->Body = "Please find your document attached.";
    $mail->addStringAttachment($pdfBuffer, "document.pdf");
    
    $mail->send();
}

$pdfBuffer = exportDocument();
sendViaSMTP($pdfBuffer);
?>`;

    default:
      return `${baseCode}
?>`;
  }
}

function getGoExample(provider: EmailProvider): string {
  const baseCode = `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

func exportDocument() ([]byte, error) {
    apiKey := os.Getenv("API_KEY")
    apiBaseUrl := os.Getenv("API_BASE_URL")
    templateId := os.Getenv("TEMPLATE_ID")
    
    url := fmt.Sprintf("%s/api/v1/templates/%s/export", apiBaseUrl, templateId)
    
    reqBody := map[string]interface{}{"sections": map[string]interface{}{}}
    jsonData, _ := json.Marshal(reqBody)
    
    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("export failed: %d", resp.StatusCode)
    }
    
    return io.ReadAll(resp.Body)
}`;

  switch (provider) {
    case "mailgun":
      return `${baseCode}

func sendViaMailgun(pdfBuffer []byte) error {
    domain := os.Getenv("MAILGUN_DOMAIN")
    apiKey := os.Getenv("MAILGUN_API_KEY")
    emailFrom := os.Getenv("EMAIL_FROM")
    emailTo := os.Getenv("EMAIL_TO")
    
    url := fmt.Sprintf("https://api.mailgun.net/v3/%s/messages", domain)
    
    var buf bytes.Buffer
    writer := multipart.NewWriter(&buf)
    
    writer.WriteField("from", emailFrom)
    writer.WriteField("to", emailTo)
    writer.WriteField("subject", "Your Document Export")
    writer.WriteField("text", "Please find your document attached.")
    
    part, _ := writer.CreateFormFile("attachment", "document.pdf")
    part.Write(pdfBuffer)
    writer.Close()
    
    req, _ := http.NewRequest("POST", url, &buf)
    req.SetBasicAuth("api", apiKey)
    req.Header.Set("Content-Type", writer.FormDataContentType())
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    return nil
}

func main() {
    pdfBuffer, err := exportDocument()
    if err != nil {
        panic(err)
    }
    sendViaMailgun(pdfBuffer)
}`;

    case "resend":
      return `${baseCode}

func sendViaResend(pdfBuffer []byte) error {
    apiKey := os.Getenv("RESEND_API_KEY")
    emailFrom := os.Getenv("EMAIL_FROM")
    emailTo := os.Getenv("EMAIL_TO")
    
    pdfBase64 := base64.StdEncoding.EncodeToString(pdfBuffer)
    
    payload := map[string]interface{}{
        "from":    emailFrom,
        "to":      emailTo,
        "subject": "Your Document Export",
        "text":    "Please find your document attached.",
        "attachments": []map[string]string{
            {"filename": "document.pdf", "content": pdfBase64},
        },
    }
    
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    return nil
}

func main() {
    pdfBuffer, err := exportDocument()
    if err != nil {
        panic(err)
    }
    sendViaResend(pdfBuffer)
}`;

    case "sendgrid":
      return `${baseCode}

func sendViaSendGrid(pdfBuffer []byte) error {
    apiKey := os.Getenv("SENDGRID_API_KEY")
    emailFrom := os.Getenv("EMAIL_FROM")
    emailTo := os.Getenv("EMAIL_TO")
    
    pdfBase64 := base64.StdEncoding.EncodeToString(pdfBuffer)
    
    payload := map[string]interface{}{
        "personalizations": []map[string]interface{}{
            {"to": []map[string]string{{"email": emailTo}}},
        },
        "from":    map[string]string{"email": emailFrom},
        "subject": "Your Document Export",
        "content": []map[string]string{
            {"type": "text/plain", "value": "Please find your document attached."},
        },
        "attachments": []map[string]string{
            {
                "content":      pdfBase64,
                "filename":     "document.pdf",
                "type":         "application/pdf",
                "disposition":  "attachment",
            },
        },
    }
    
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", "https://api.sendgrid.com/v3/mail/send", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    return nil
}

func main() {
    pdfBuffer, err := exportDocument()
    if err != nil {
        panic(err)
    }
    sendViaSendGrid(pdfBuffer)
}`;

    case "smtp":
      return `${baseCode}

func sendViaSMTP(pdfBuffer []byte) error {
    emailFrom := os.Getenv("EMAIL_FROM")
    emailTo := os.Getenv("EMAIL_TO")
    smtpHost := os.Getenv("SMTP_HOST")
    smtpPort := os.Getenv("SMTP_PORT")
    smtpUser := os.Getenv("SMTP_USER")
    smtpPass := os.Getenv("SMTP_PASSWORD")
    
    auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
    
    msg := []byte("To: " + emailTo + "\\r\\n" +
        "Subject: Your Document Export\\r\\n" +
        "MIME-Version: 1.0\\r\\n" +
        "Content-Type: multipart/mixed; boundary=boundary123\\r\\n" +
        "\\r\\n" +
        "--boundary123\\r\\n" +
        "Content-Type: text/plain\\r\\n" +
        "\\r\\n" +
        "Please find your document attached.\\r\\n" +
        "--boundary123\\r\\n" +
        "Content-Type: application/pdf\\r\\n" +
        "Content-Disposition: attachment; filename=document.pdf\\r\\n" +
        "\\r\\n")
    
    msg = append(msg, pdfBuffer...)
    msg = append(msg, []byte("\\r\\n--boundary123--\\r\\n")...)
    
    return smtp.SendMail(smtpHost+":"+smtpPort, auth, emailFrom, []string{emailTo}, msg)
}

func main() {
    pdfBuffer, err := exportDocument()
    if err != nil {
        panic(err)
    }
    sendViaSMTP(pdfBuffer)
}`;

    default:
      return `${baseCode}
}`;
  }
}

function getJavaExample(provider: EmailProvider): string {
  const baseCode = `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class DocumentExporter {
    private static final String API_KEY = System.getenv("API_KEY");
    private static final String API_BASE_URL = System.getenv("API_BASE_URL");
    private static final String TEMPLATE_ID = System.getenv("TEMPLATE_ID");
    
    public static byte[] exportDocument() throws Exception {
        String url = API_BASE_URL + "/api/v1/templates/" + TEMPLATE_ID + "/export";
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Authorization", "Bearer " + API_KEY)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString("{\\"sections\\": {}}"))
            .build();
        
        HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
        
        if (response.statusCode() != 200) {
            throw new Exception("Export failed: " + response.statusCode());
        }
        
        return response.body();
    }
}`;

  switch (provider) {
    case "mailgun":
      return `${baseCode}

    public static void sendViaMailgun(byte[] pdfBuffer) throws Exception {
        String domain = System.getenv("MAILGUN_DOMAIN");
        String apiKey = System.getenv("MAILGUN_API_KEY");
        String emailFrom = System.getenv("EMAIL_FROM");
        String emailTo = System.getenv("EMAIL_TO");
        
        // Use Apache HttpClient or similar for multipart form data
        // This is a simplified example
        String url = "https://api.mailgun.net/v3/" + domain + "/messages";
        
        // Implementation would use multipart form data
        // See: https://www.baeldung.com/java-httpclient-multipart-upload
    }
    
    public static void main(String[] args) throws Exception {
        byte[] pdfBuffer = exportDocument();
        sendViaMailgun(pdfBuffer);
    }
}`;

    case "resend":
      return `${baseCode}

    public static void sendViaResend(byte[] pdfBuffer) throws Exception {
        String apiKey = System.getenv("RESEND_API_KEY");
        String emailFrom = System.getenv("EMAIL_FROM");
        String emailTo = System.getenv("EMAIL_TO");
        
        String pdfBase64 = Base64.getEncoder().encodeToString(pdfBuffer);
        
        String jsonBody = String.format(
            "{\\"from\\": \\"%s\\", \\"to\\": \\"%s\\", \\"subject\\": \\"Your Document Export\\", " +
            "\\"text\\": \\"Please find your document attached.\\", " +
            "\\"attachments\\": [{\\"filename\\": \\"document.pdf\\", \\"content\\": \\"%s\\"}]}",
            emailFrom, emailTo, pdfBase64
        );
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.resend.com/emails"))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();
        
        client.send(request, HttpResponse.BodyHandlers.ofString());
    }
    
    public static void main(String[] args) throws Exception {
        byte[] pdfBuffer = exportDocument();
        sendViaResend(pdfBuffer);
    }
}`;

    case "sendgrid":
      return `${baseCode}

    public static void sendViaSendGrid(byte[] pdfBuffer) throws Exception {
        String apiKey = System.getenv("SENDGRID_API_KEY");
        String emailFrom = System.getenv("EMAIL_FROM");
        String emailTo = System.getenv("EMAIL_TO");
        
        String pdfBase64 = Base64.getEncoder().encodeToString(pdfBuffer);
        
        String jsonBody = String.format(
            "{\\"personalizations\\": [{\\"to\\": [{\\"email\\": \\"%s\\"}]}], " +
            "\\"from\\": {\\"email\\": \\"%s\\"}, \\"subject\\": \\"Your Document Export\\", " +
            "\\"content\\": [{\\"type\\": \\"text/plain\\", \\"value\\": \\"Please find your document attached.\\"}], " +
            "\\"attachments\\": [{\\"content\\": \\"%s\\", \\"filename\\": \\"document.pdf\\", " +
            "\\"type\\": \\"application/pdf\\", \\"disposition\\": \\"attachment\\"}]}",
            emailTo, emailFrom, pdfBase64
        );
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.sendgrid.com/v3/mail/send"))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();
        
        client.send(request, HttpResponse.BodyHandlers.ofString());
    }
    
    public static void main(String[] args) throws Exception {
        byte[] pdfBuffer = exportDocument();
        sendViaSendGrid(pdfBuffer);
    }
}`;

    case "smtp":
      return `${baseCode}

    public static void sendViaSMTP(byte[] pdfBuffer) throws Exception {
        String emailFrom = System.getenv("EMAIL_FROM");
        String emailTo = System.getenv("EMAIL_TO");
        String smtpHost = System.getenv("SMTP_HOST");
        String smtpPort = System.getenv("SMTP_PORT");
        String smtpUser = System.getenv("SMTP_USER");
        String smtpPass = System.getenv("SMTP_PASSWORD");
        
        Properties props = new Properties();
        props.put("mail.smtp.host", smtpHost);
        props.put("mail.smtp.port", smtpPort);
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        
        Session session = Session.getInstance(props, new javax.mail.Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(smtpUser, smtpPass);
            }
        });
        
        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(emailFrom));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(emailTo));
        message.setSubject("Your Document Export");
        message.setText("Please find your document attached.");
        
        MimeBodyPart attachmentPart = new MimeBodyPart();
        attachmentPart.setContent(pdfBuffer, "application/pdf");
        attachmentPart.setFileName("document.pdf");
        
        Multipart multipart = new MimeMultipart();
        multipart.addBodyPart(attachmentPart);
        message.setContent(multipart);
        
        Transport.send(message);
    }
    
    public static void main(String[] args) throws Exception {
        byte[] pdfBuffer = exportDocument();
        sendViaSMTP(pdfBuffer);
    }
}`;

    default:
      return `${baseCode}
}`;
  }
}

function getRubyExample(provider: EmailProvider): string {
  const baseCode = `require 'net/http'
require 'json'
require 'base64'

API_KEY = ENV['API_KEY']
API_BASE_URL = ENV['API_BASE_URL']
TEMPLATE_ID = ENV['TEMPLATE_ID']
EMAIL_TO = ENV['EMAIL_TO']
EMAIL_FROM = ENV['EMAIL_FROM']

def export_document
  uri = URI("#{API_BASE_URL}/api/v1/templates/#{TEMPLATE_ID}/export")
  
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = uri.scheme == 'https'
  
  request = Net::HTTP::Post.new(uri)
  request['Authorization'] = "Bearer #{API_KEY}"
  request['Content-Type'] = 'application/json'
  request.body = { sections: {} }.to_json
  
  response = http.request(request)
  
  unless response.code == '200'
    raise "Export failed: #{response.code}"
  end
  
  response.body
end`;

  switch (provider) {
    case "mailgun":
      return `${baseCode}

def send_via_mailgun(pdf_buffer)
  domain = ENV['MAILGUN_DOMAIN']
  api_key = ENV['MAILGUN_API_KEY']
  
  uri = URI("https://api.mailgun.net/v3/#{domain}/messages")
  
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri)
  request.basic_auth('api', api_key)
  
  form_data = [
    ['from', EMAIL_FROM],
    ['to', EMAIL_TO],
    ['subject', 'Your Document Export'],
    ['text', 'Please find your document attached.'],
    ['attachment', pdf_buffer, { filename: 'document.pdf', content_type: 'application/pdf' }]
  ]
  
  request.set_form(form_data, 'multipart/form-data')
  http.request(request)
end

pdf_buffer = export_document
send_via_mailgun(pdf_buffer)`;

    case "resend":
      return `${baseCode}

def send_via_resend(pdf_buffer)
  api_key = ENV['RESEND_API_KEY']
  pdf_base64 = Base64.encode64(pdf_buffer)
  
  uri = URI('https://api.resend.com/emails')
  
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri)
  request['Authorization'] = "Bearer #{api_key}"
  request['Content-Type'] = 'application/json'
  request.body = {
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: 'Your Document Export',
    text: 'Please find your document attached.',
    attachments: [{ filename: 'document.pdf', content: pdf_base64 }]
  }.to_json
  
  http.request(request)
end

pdf_buffer = export_document
send_via_resend(pdf_buffer)`;

    case "sendgrid":
      return `${baseCode}

def send_via_sendgrid(pdf_buffer)
  api_key = ENV['SENDGRID_API_KEY']
  pdf_base64 = Base64.encode64(pdf_buffer)
  
  uri = URI('https://api.sendgrid.com/v3/mail/send')
  
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri)
  request['Authorization'] = "Bearer #{api_key}"
  request['Content-Type'] = 'application/json'
  request.body = {
    personalizations: [{ to: [{ email: EMAIL_TO }] }],
    from: { email: EMAIL_FROM },
    subject: 'Your Document Export',
    content: [{ type: 'text/plain', value: 'Please find your document attached.' }],
    attachments: [{
      content: pdf_base64,
      filename: 'document.pdf',
      type: 'application/pdf',
      disposition: 'attachment'
    }]
  }.to_json
  
  http.request(request)
end

pdf_buffer = export_document
send_via_sendgrid(pdf_buffer)`;

    case "smtp":
      return `${baseCode}

def send_via_smtp(pdf_buffer)
  require 'mail'
  
  Mail.defaults do
    delivery_method :smtp, {
      address: ENV['SMTP_HOST'],
      port: ENV['SMTP_PORT'].to_i,
      user_name: ENV['SMTP_USER'],
      password: ENV['SMTP_PASSWORD'],
      authentication: 'plain',
      enable_starttls_auto: ENV['SMTP_SECURE'] != 'true'
    }
  end
  
  Mail.deliver do
    from EMAIL_FROM
    to EMAIL_TO
    subject 'Your Document Export'
    body 'Please find your document attached.'
    add_file filename: 'document.pdf', content: pdf_buffer
  end
end

pdf_buffer = export_document
send_via_smtp(pdf_buffer)`;

    default:
      return `${baseCode}
end`;
  }
}

function getCSharpExample(provider: EmailProvider): string {
  const baseCode = `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class DocumentExporter
{
    private static readonly string ApiKey = Environment.GetEnvironmentVariable("API_KEY");
    private static readonly string ApiBaseUrl = Environment.GetEnvironmentVariable("API_BASE_URL");
    private static readonly string TemplateId = Environment.GetEnvironmentVariable("TEMPLATE_ID");
    
    public static async Task<byte[]> ExportDocumentAsync()
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {ApiKey}");
        
        var url = $"{ApiBaseUrl}/api/v1/templates/{TemplateId}/export";
        var content = new StringContent("{\\"sections\\": {}}", Encoding.UTF8, "application/json");
        
        var response = await client.PostAsync(url, content);
        response.EnsureSuccessStatusCode();
        
        return await response.Content.ReadAsByteArrayAsync();
    }
}`;

  switch (provider) {
    case "mailgun":
      return `${baseCode}

    public static async Task SendViaMailgunAsync(byte[] pdfBuffer)
    {
        var domain = Environment.GetEnvironmentVariable("MAILGUN_DOMAIN");
        var apiKey = Environment.GetEnvironmentVariable("MAILGUN_API_KEY");
        var emailFrom = Environment.GetEnvironmentVariable("EMAIL_FROM");
        var emailTo = Environment.GetEnvironmentVariable("EMAIL_TO");
        
        using var client = new HttpClient();
        var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"api:{apiKey}"));
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authValue);
        
        using var formData = new MultipartFormDataContent();
        formData.Add(new StringContent(emailFrom), "from");
        formData.Add(new StringContent(emailTo), "to");
        formData.Add(new StringContent("Your Document Export"), "subject");
        formData.Add(new StringContent("Please find your document attached."), "text");
        formData.Add(new ByteArrayContent(pdfBuffer), "attachment", "document.pdf");
        
        var url = $"https://api.mailgun.net/v3/{domain}/messages";
        await client.PostAsync(url, formData);
    }
    
    public static async Task Main(string[] args)
    {
        var pdfBuffer = await ExportDocumentAsync();
        await SendViaMailgunAsync(pdfBuffer);
    }
}`;

    case "resend":
      return `${baseCode}

    public static async Task SendViaResendAsync(byte[] pdfBuffer)
    {
        var apiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY");
        var emailFrom = Environment.GetEnvironmentVariable("EMAIL_FROM");
        var emailTo = Environment.GetEnvironmentVariable("EMAIL_TO");
        var pdfBase64 = Convert.ToBase64String(pdfBuffer);
        
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        
        var payload = new
        {
            from = emailFrom,
            to = emailTo,
            subject = "Your Document Export",
            text = "Please find your document attached.",
            attachments = new[] { new { filename = "document.pdf", content = pdfBase64 } }
        };
        
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        await client.PostAsync("https://api.resend.com/emails", content);
    }
    
    public static async Task Main(string[] args)
    {
        var pdfBuffer = await ExportDocumentAsync();
        await SendViaResendAsync(pdfBuffer);
    }
}`;

    case "sendgrid":
      return `${baseCode}

    public static async Task SendViaSendGridAsync(byte[] pdfBuffer)
    {
        var apiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
        var emailFrom = Environment.GetEnvironmentVariable("EMAIL_FROM");
        var emailTo = Environment.GetEnvironmentVariable("EMAIL_TO");
        var pdfBase64 = Convert.ToBase64String(pdfBuffer);
        
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        
        var payload = new
        {
            personalizations = new[] { new { to = new[] { new { email = emailTo } } } },
            from = new { email = emailFrom },
            subject = "Your Document Export",
            content = new[] { new { type = "text/plain", value = "Please find your document attached." } },
            attachments = new[] { new { content = pdfBase64, filename = "document.pdf", type = "application/pdf", disposition = "attachment" } }
        };
        
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        await client.PostAsync("https://api.sendgrid.com/v3/mail/send", content);
    }
    
    public static async Task Main(string[] args)
    {
        var pdfBuffer = await ExportDocumentAsync();
        await SendViaSendGridAsync(pdfBuffer);
    }
}`;

    case "smtp":
      return `${baseCode}

    public static async Task SendViaSMTPAsync(byte[] pdfBuffer)
    {
        var emailFrom = Environment.GetEnvironmentVariable("EMAIL_FROM");
        var emailTo = Environment.GetEnvironmentVariable("EMAIL_TO");
        var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST");
        var smtpPort = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587");
        var smtpUser = Environment.GetEnvironmentVariable("SMTP_USER");
        var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
        
        using var client = new System.Net.Mail.SmtpClient(smtpHost, smtpPort);
        client.EnableSsl = Environment.GetEnvironmentVariable("SMTP_SECURE") == "true";
        client.Credentials = new System.Net.NetworkCredential(smtpUser, smtpPass);
        
        using var message = new System.Net.Mail.MailMessage(emailFrom, emailTo)
        {
            Subject = "Your Document Export",
            Body = "Please find your document attached."
        };
        
        message.Attachments.Add(new System.Net.Mail.Attachment(new System.IO.MemoryStream(pdfBuffer), "document.pdf"));
        
        await client.SendMailAsync(message);
    }
    
    public static async Task Main(string[] args)
    {
        var pdfBuffer = await ExportDocumentAsync();
        await SendViaSMTPAsync(pdfBuffer);
    }
}`;

    default:
      return `${baseCode}
}`;
  }
}
