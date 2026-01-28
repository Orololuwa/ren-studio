import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export function RenStudioLogo({ className, ...props }: ComponentProps<"img">) {
  return (
    <>
      <img
        alt="Ren Studio"
        className={cn("h-8 w-auto dark:hidden", className)}
        src="https://iwvduhvsxhjpxapdochp.supabase.co/storage/v1/object/public/app-images/ren-studio/ren-studio.svg"
        {...props}
      />
      <img
        alt="Ren Studio"
        className={cn("hidden h-8 w-auto dark:block", className)}
        src="https://iwvduhvsxhjpxapdochp.supabase.co/storage/v1/object/public/app-images/ren-studio/ren-studio-dark-mode.svg"
        {...props}
      />
    </>
  );
}
