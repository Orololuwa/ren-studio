export default {
  title: "API Documentation",
  description:
    "Complete guide to using our API for template preview and export functionality.",
  pageTitle: "API Documentation",
  introduction: {
    title: "Introduction",
    overview:
      "Our API provides programmatic access to template preview and export functionality. You can generate HTML previews and PDF exports of your templates using simple HTTP requests.",
    features:
      "Key features include: secure API key authentication, support for custom template data, multiple response formats (HTML/PDF or JSON), and comprehensive error handling.",
  },
  gettingStarted: {
    title: "Getting Started",
    apiKey: {
      title: "Getting Your API Key",
      description:
        "To use the API, you'll need an API key. Navigate to your organization settings, then go to the API Keys section. If you don't have a key yet, one will be automatically generated for you. Copy your API key and keep it secure - you'll use it to authenticate all API requests.",
    },
    authentication: {
      title: "Authentication",
      description:
        "All API requests must include your API key in the Authorization header using Bearer token authentication:",
    },
    firstCall: {
      title: "Making Your First API Call",
      description:
        "Here's a simple example of how to preview a template using cURL:",
    },
  },
  apiDocumentation: {
    title: "API Documentation",
    preview: {
      title: "Preview API",
      description:
        "Generate an HTML preview of a template. Returns the rendered HTML that can be displayed in a browser or embedded in your application.",
      request: {
        title: "Request Body",
      },
      response: {
        title: "Response",
        description:
          "By default, returns HTML content. Include ?format=json or Accept: application/json header to get a JSON response:",
      },
      queryParams: {
        title: "Query Parameters",
      },
    },
    export: {
      title: "Export API",
      description:
        "Generate a PDF export of a template. Returns a PDF file that can be downloaded, stored, or sent as an email attachment.",
      request: {
        title: "Request Body",
      },
      response: {
        title: "Response",
        description:
          "By default, returns PDF binary content. Include ?format=json or Accept: application/json header to get a JSON response with base64-encoded PDF:",
      },
      queryParams: {
        title: "Query Parameters",
      },
      useCases: {
        title: "Use Cases: Sending PDFs via Email",
        description:
          "Below are code examples for exporting a template as PDF and sending it as an email attachment using various email providers. Select your preferred email provider and programming language:",
        emailProvider: "Email Provider",
      },
    },
  },
  payloadSchema: {
    title: "Payload Schema Reference",
    description:
      "Complete reference for all template types, sections, and fields. Each template type has specific sections with defined fields, data types, and requirements.",
  },
};
