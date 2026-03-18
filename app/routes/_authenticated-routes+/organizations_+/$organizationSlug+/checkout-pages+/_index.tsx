import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { data, href, useNavigate } from "react-router";
import { z } from "zod";

import type { Route } from "./+types/_index";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  deleteCheckoutPageFromDatabase,
  retrieveCheckoutPagesFromDatabaseByOrganizationId,
} from "~/features/checkout/checkout-pages-model.server";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { createToastHeaders } from "~/utils/toast.server";
import { validateFormData } from "~/utils/validate-form-data.server";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);
  const i18n = getInstance(context);

  const checkoutPages = await retrieveCheckoutPagesFromDatabaseByOrganizationId(
    {
      organizationId: organization.id,
    },
  );

  return data(
    {
      breadcrumb: {
        title: "Checkout Pages",
        to: href("/organizations/:organizationSlug/checkout-pages", {
          organizationSlug: params.organizationSlug,
        }),
      },
      checkoutPages,
      organizationSlug: params.organizationSlug,
      pageTitle: getPageTitle(i18n.t.bind(i18n), "Checkout Pages"),
    },
    { headers },
  );
}

const deleteSchema = z.object({
  checkoutPageId: z.string(),
  intent: z.literal("delete"),
});

export async function action({ request, context }: Route.ActionArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);
  const result = await validateFormData(request, deleteSchema);
  if (!result.success) return result.response;

  const deleted = await deleteCheckoutPageFromDatabase({
    checkoutPageId: result.data.checkoutPageId,
    organizationId: organization.id,
  });

  if (!deleted) {
    return data(
      { success: false, error: "Checkout page not found" },
      { status: 404, headers },
    );
  }

  const toastHeaders = await createToastHeaders({
    title: "Checkout page deleted",
    description: "Your checkout page has been deleted.",
  });

  return data(
    { success: true },
    {
      headers: {
        ...Object.fromEntries(headers),
        ...Object.fromEntries(toastHeaders),
      },
    },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function CheckoutPagesIndexRoute({
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const { checkoutPages, organizationSlug } = loaderData;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Checkout Pages</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage your public checkout links.
          </p>
        </div>
        <Button
          onClick={() =>
            navigate(`/organizations/${organizationSlug}/checkout-pages/new`)
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>

      {checkoutPages.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          No checkout pages yet. Click “Create New” to get started.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checkoutPages.map((page) => (
            <CheckoutPageCardComponent
              key={page.id}
              onEdit={() =>
                navigate(
                  `/organizations/${organizationSlug}/checkout-pages/${page.id}`,
                )
              }
              page={page}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckoutPageCardComponent({
  page,
  onEdit,
}: {
  page: Route.ComponentProps["loaderData"]["checkoutPages"][number];
  onEdit: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="truncate">{page.name}</CardTitle>
          <CardDescription className="space-y-1">
            <div className="truncate">Slug: {page.slug}</div>
            <div className="text-xs">
              {page.isActive ? "Active" : "Inactive"} · {page.paymentCount}{" "}
              payments
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1" />
        <CardFooter className="gap-2">
          <Button className="flex-1" onClick={onEdit}>
            Edit
          </Button>
          <Button
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setOpen(true)}
            size="icon"
            variant="ghost"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog onOpenChange={setOpen} open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete checkout page</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete “{page.name}” and all its payments/receipts. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const formData = new FormData();
                formData.set("intent", "delete");
                formData.set("checkoutPageId", page.id);
                await fetch(window.location.pathname, {
                  method: "POST",
                  body: formData,
                });
                setOpen(false);
                window.location.reload();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
