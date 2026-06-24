import { ConsoleApiError } from "@/lib/console-api";

export function apiErrorMessage(error: unknown) {
  if (error instanceof ConsoleApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo completar la operacion.";
}
