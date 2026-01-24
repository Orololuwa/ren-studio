import type { Route } from "./+types/docs";
import { ApiDocsPage } from "~/features/docs/api-docs-page";
import { Footer } from "~/features/landing/footer";
import { Header } from "~/features/landing/header";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { anonymousMiddleware } from "~/features/user-authentication/user-authentication-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export const middleware = [anonymousMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  return {
    pageTitle: getPageTitle(t, "docs:pageTitle"),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function DocsRoute() {
  return (
    <div className="overflow-hidden">
      <Header />

      <main className="container mx-auto pt-[var(--header-height)]">
        <ApiDocsPage />
      </main>

      <Footer />
    </div>
  );
}
