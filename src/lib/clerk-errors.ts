import { isClerkAPIResponseError } from "@clerk/expo";

export function clerkErrorCode(error: unknown) {
  return isClerkAPIResponseError(error) ? error.errors[0]?.code : undefined;
}

export function clerkErrorMessage(error: unknown, fallback: string) {
  if (!isClerkAPIResponseError(error)) return fallback;

  return error.errors[0]?.longMessage ?? error.errors[0]?.message ?? fallback;
}
