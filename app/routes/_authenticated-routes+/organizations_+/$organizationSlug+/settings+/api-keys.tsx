import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { data, Form, href, Link } from "react-router";

import type { Route } from "./+types/api-keys";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { regenerateApiKeyAction } from "~/features/organizations/settings/api-keys/api-key-action.server";
import {
  createOrRegenerateApiKey,
  getDecryptedApiKey,
  getOrganizationApiKey,
} from "~/features/organizations/settings/api-keys/api-key-model.server";
import { OrganizationMembershipRole } from "~/generated/browser";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ context, params }: Route.LoaderArgs) {
  const { headers, organization, role, user } = context.get(
    organizationMembershipContext,
  );
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  const userIsOwnerOrAdmin =
    role === OrganizationMembershipRole.owner ||
    role === OrganizationMembershipRole.admin;

  // Get existing API key (if any)
  let apiKeyRecord = await getOrganizationApiKey(organization.id);
  let newlyGeneratedKey: string | null = null;
  let decryptedKey: string | null = null;

  // If no key exists and user is owner/admin, auto-generate one
  if (!apiKeyRecord && userIsOwnerOrAdmin) {
    newlyGeneratedKey = await createOrRegenerateApiKey(
      organization.id,
      user.id,
    );
    // Fetch the newly created record
    apiKeyRecord = await getOrganizationApiKey(organization.id);
    decryptedKey = newlyGeneratedKey;
  } else if (apiKeyRecord && userIsOwnerOrAdmin) {
    // Decrypt existing key so user can view/copy it
    decryptedKey = await getDecryptedApiKey(organization.id);
  }

  return data(
    {
      breadcrumb: {
        title: t("organizations:settings.apiKeys.breadcrumb"),
        to: href("/organizations/:organizationSlug/settings/api-keys", {
          organizationSlug: params.organizationSlug,
        }),
      },
      organization,
      pageTitle: getPageTitle(t, "organizations:settings.apiKeys.pageTitle"),
      userIsOwnerOrAdmin,
      apiKeyPrefix: apiKeyRecord?.keyPrefix || null,
      hasApiKey: !!apiKeyRecord,
      newlyGeneratedKey,
      decryptedKey, // Full decrypted key for display
    },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(args: Route.ActionArgs) {
  const { context } = args;
  const { organization, role, user } = context.get(
    organizationMembershipContext,
  );

  const formData = await args.request.formData();
  const intent = formData.get("intent");

  if (intent === "regenerate") {
    return regenerateApiKeyAction({
      organizationId: organization.id,
      userId: user.id,
      role,
    });
  }

  return data({ error: "Invalid intent" }, { status: 400 });
}

export default function ApiKeysSettingsRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.apiKeys",
  });
  const { userIsOwnerOrAdmin, apiKeyPrefix, newlyGeneratedKey, decryptedKey } =
    loaderData;
  const [copied, setCopied] = useState(false);

  // Use actionData if available (from regeneration), otherwise use loaderData
  // Priority: actionData (newly regenerated) > newlyGeneratedKey (auto-generated) > decryptedKey (existing) > prefix
  const displayKey =
    (actionData && "apiKey" in actionData ? actionData.apiKey : null) ||
    newlyGeneratedKey ||
    decryptedKey ||
    apiKeyPrefix ||
    null;
  const isFullKey = displayKey && displayKey.length > 8;

  const handleCopy = async () => {
    if (displayKey) {
      await navigator.clipboard.writeText(displayKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!userIsOwnerOrAdmin) {
    return (
      <div className="px-4 py-4 md:py-6 lg:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {t("unauthorized") ||
                "You don't have permission to view API keys"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:py-6 lg:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="leading-none font-semibold">{t("pageTitle")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("description") ||
                "Manage your organization's API keys for programmatic access."}
            </p>
          </div>
          <Link
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            rel="noopener noreferrer"
            target="_blank"
            to="/docs"
          >
            View API Docs
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {actionData && "error" in actionData && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {("message" in actionData &&
              typeof actionData.message === "string"
                ? actionData.message
                : null) || actionData.error}
            </p>
          </div>
        )}

        {displayKey && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {t("apiKeyLabel") || "API Key"}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                  {displayKey}
                </div>
                <button
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                  onClick={handleCopy}
                  type="button"
                >
                  {copied ? t("copied") || "Copied!" : t("copy") || "Copy"}
                </button>
              </div>
              {!isFullKey && displayKey && (
                <p className="text-muted-foreground text-xs">
                  {t("keyPrefixNote") ||
                    "Only the prefix is shown. The full key is only displayed immediately after generation."}
                </p>
              )}
              {isFullKey && (
                <p className="text-muted-foreground text-xs">
                  {t("keyFullNote") ||
                    "Save this key securely. You won't be able to view it again after leaving this page."}
                </p>
              )}
            </div>

            <Form method="post">
              <input name="intent" type="hidden" value="regenerate" />
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
                type="submit"
              >
                {t("regenerate") || "Regenerate API Key"}
              </button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
