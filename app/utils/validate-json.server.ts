import type * as z from "zod";

import { badRequest } from "./http-responses.server";

/**
 * Validates JSON body from a request using a Zod schema.
 *
 * @param request - The HTTP request containing the JSON body to validate
 * @param schema - A Zod schema to validate the JSON body against
 * @returns A result object with either `{ success: true, data: T }` on success
 * or `{ success: false, response: Response }` on validation failure
 *
 * @example
 * ```ts
 * import { z } from "zod";
 *
 * const createUserSchema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(1),
 * });
 *
 * export async function action({ request }: Route.ActionArgs) {
 *   const result = await validateJson(request, createUserSchema);
 *
 *   if (!result.success) {
 *     // Returns a 400 response with validation errors
 *     return result.response;
 *   }
 *
 *   // Type-safe access to validated data
 *   const { email, name } = result.data;
 *
 *   // Process the validated data and return ...
 * }
 * ```
 */
export async function validateJson<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (_error) {
    return {
      response: badRequest({
        error: "Invalid JSON",
        message: "Request body must be valid JSON",
      }),
      success: false as const,
    };
  }

  const result = await schema.safeParseAsync(body);

  if (!result.success) {
    return {
      response: badRequest({
        error: "Validation failed",
        issues: result.error.issues,
      }),
      success: false as const,
    };
  }

  return { data: result.data, success: true as const };
}
