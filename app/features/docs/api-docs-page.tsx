import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { EmailProvider, Language } from "./code-examples";
import { getCodeExample } from "./code-examples";
import type { SectionSchema, TemplateSchema } from "./payload-schema";
import { getAllTemplateSchemas } from "./payload-schema";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

function CodeBlock({ code }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <Button
          className="h-8 w-8"
          onClick={handleCopy}
          size="icon"
          type="button"
          variant="outline"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <pre className="max-h-[600px] overflow-auto rounded-md border bg-muted p-4 pr-12 text-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function ApiDocsPage() {
  const { t } = useTranslation("docs");
  const [selectedProvider, setSelectedProvider] =
    useState<EmailProvider>("mailgun");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("node");

  const codeExample = getCodeExample(selectedLanguage, selectedProvider);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
      </div>

      {/* Introduction Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">
          {t("introduction.title")}
        </h2>
        <div className="space-y-4 text-muted-foreground">
          <p>{t("introduction.overview")}</p>
          <p>{t("introduction.features")}</p>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">
          {t("gettingStarted.title")}
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-xl font-medium">
              {t("gettingStarted.apiKey.title")}
            </h3>
            <p className="text-muted-foreground">
              {t("gettingStarted.apiKey.description")}
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-xl font-medium">
              {t("gettingStarted.authentication.title")}
            </h3>
            <p className="mb-4 text-muted-foreground">
              {t("gettingStarted.authentication.description")}
            </p>
            <CodeBlock
              code={`Authorization: Bearer YOUR_API_KEY`}
              language="text"
            />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-medium">
              {t("gettingStarted.firstCall.title")}
            </h3>
            <p className="mb-4 text-muted-foreground">
              {t("gettingStarted.firstCall.description")}
            </p>
            <CodeBlock
              code={`curl -X POST "https://your-api-url.com/api/v1/templates/your-template-id/preview" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"sections": {}}'`}
              language="bash"
            />
          </div>
        </div>
      </section>

      {/* API Documentation */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          {t("apiDocumentation.title")}
        </h2>

        {/* Preview API */}
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-medium">
            {t("apiDocumentation.preview.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="mb-2 font-mono text-sm">
                POST /api/v1/templates/:templateId/preview
              </p>
              <p className="text-muted-foreground">
                {t("apiDocumentation.preview.description")}
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">
                {t("apiDocumentation.preview.request.title")}
              </h4>
              <CodeBlock
                code={`{
  "sections": {
    "resume-header": {
      "name": "John Doe",
      "title": "Software Engineer"
    }
  }
}`}
                language="json"
              />
            </div>
            <div>
              <h4 className="mb-2 font-semibold">
                {t("apiDocumentation.preview.response.title")}
              </h4>
              <p className="mb-2 text-sm text-muted-foreground">
                {t("apiDocumentation.preview.response.description")}
              </p>
              <CodeBlock
                code={`// HTML format (default)
<html>...</html>

// JSON format (?format=json or Accept: application/json)
{
  "html": "<html>...</html>"
}`}
                language="text"
              />
            </div>
            <div>
              <h4 className="mb-2 font-semibold">
                {t("apiDocumentation.preview.queryParams.title")}
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1">format=json</code> -
                  Return JSON response with HTML string
                </li>
                <li>
                  <code className="rounded bg-muted px-1">
                    Accept: application/json
                  </code>{" "}
                  - Same as format=json
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Export API */}
        <div>
          <h3 className="mb-4 text-xl font-medium">
            {t("apiDocumentation.export.title")}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="mb-2 font-mono text-sm">
                POST /api/v1/templates/:templateId/export
              </p>
              <p className="text-muted-foreground">
                {t("apiDocumentation.export.description")}
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">
                {t("apiDocumentation.export.request.title")}
              </h4>
              <CodeBlock
                code={`{
  "sections": {
    "resume-header": {
      "name": "John Doe",
      "title": "Software Engineer"
    }
  }
}`}
                language="json"
              />
            </div>
            <div>
              <h4 className="mb-2 font-semibold">
                {t("apiDocumentation.export.response.title")}
              </h4>
              <p className="mb-2 text-sm text-muted-foreground">
                {t("apiDocumentation.export.response.description")}
              </p>
              <CodeBlock
                code={`// PDF format (default)
Binary PDF content

// JSON format (?format=json or Accept: application/json)
{
  "pdf": "base64-encoded-pdf-content"
}`}
                language="text"
              />
            </div>
            <div>
              <h4 className="mb-2 font-semibold">
                {t("apiDocumentation.export.queryParams.title")}
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1">format=json</code> -
                  Return JSON response with base64-encoded PDF
                </li>
                <li>
                  <code className="rounded bg-muted px-1">
                    Accept: application/json
                  </code>{" "}
                  - Same as format=json
                </li>
              </ul>
            </div>

            {/* Use Cases Section */}
            <div className="mt-8">
              <h4 className="mb-4 text-lg font-semibold">
                {t("apiDocumentation.export.useCases.title")}
              </h4>
              <p className="mb-6 text-muted-foreground">
                {t("apiDocumentation.export.useCases.description")}
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium">
                    {t("apiDocumentation.export.useCases.emailProvider")}:
                  </div>
                  <Select
                    onValueChange={(value) =>
                      setSelectedProvider(value as EmailProvider)
                    }
                    value={selectedProvider}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="smtp">SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Tabs
                  defaultValue="node"
                  onValueChange={(value) =>
                    setSelectedLanguage(value as Language)
                  }
                  value={selectedLanguage}
                >
                  <TabsList className="grid w-full grid-cols-8">
                    <TabsTrigger value="csharp">C#</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="go">GO</TabsTrigger>
                    <TabsTrigger value="java">JAVA</TabsTrigger>
                    <TabsTrigger value="node">NODE</TabsTrigger>
                    <TabsTrigger value="php">PHP</TabsTrigger>
                    <TabsTrigger value="python">PYTHON</TabsTrigger>
                    <TabsTrigger value="ruby">RUBY</TabsTrigger>
                  </TabsList>

                  <TabsContent className="mt-4" value={selectedLanguage}>
                    <CodeBlock code={codeExample} language={selectedLanguage} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payload Schema Section */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          {t("payloadSchema.title")}
        </h2>
        <p className="mb-6 text-muted-foreground">
          {t("payloadSchema.description")}
        </p>

        <div className="space-y-8">
          {getAllTemplateSchemas().map((templateSchema: TemplateSchema) => (
            <div className="space-y-4" key={templateSchema.templateType}>
              <div>
                <h3 className="mb-2 text-xl font-semibold capitalize">
                  {templateSchema.templateType} Template
                </h3>
                <p className="text-sm text-muted-foreground">
                  Section ID format:{" "}
                  <code className="rounded bg-muted px-1">
                    {templateSchema.templateType}-{"{sectionType}"}
                  </code>
                </p>
              </div>

              <div className="space-y-6">
                {templateSchema.sections.map((section: SectionSchema) => (
                  <div
                    className="rounded-lg border bg-card p-4"
                    key={section.sectionId}
                  >
                    <div className="mb-4">
                      <h4 className="mb-1 font-semibold">{section.label}</h4>
                      <p className="text-sm text-muted-foreground">
                        Section ID:{" "}
                        <code className="rounded bg-muted px-1">
                          {section.sectionId}
                        </code>
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="px-3 py-2 text-left font-semibold">
                              Field
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Type
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Required
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.fields.map((field) => (
                            <tr className="border-b" key={field.name}>
                              <td className="px-3 py-2 font-mono text-xs">
                                {field.name}
                              </td>
                              <td className="px-3 py-2">
                                <code className="rounded bg-muted px-1 text-xs">
                                  {field.type}
                                </code>
                              </td>
                              <td className="px-3 py-2">
                                {field.required ? (
                                  <span className="text-destructive font-medium">
                                    Required
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Optional
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {field.description || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 rounded-md border bg-muted/50 p-3">
                      <p className="mb-2 text-xs font-semibold">
                        Field Structure:
                      </p>
                      <pre className="overflow-x-auto rounded bg-background p-2 text-xs">
                        <code>
                          {JSON.stringify(section.structureExample, null, 2)}
                        </code>
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
