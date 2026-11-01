import Constants from "expo-constants";

/**
 * API routes are served by the same origin as the dev server. On a device that
 * origin is the Metro host, not `localhost`, so the base URL is derived from
 * `hostUri` in development and must be configured for a published build.
 */
export function apiUrl(path: string): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;

  if (configured) {
    return `${configured.replace(/\/+$/, "")}${path}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    return `http://${hostUri}${path}`;
  }

  throw new Error(
    "Cannot reach API routes. Set EXPO_PUBLIC_API_URL to the deployed server origin.",
  );
}
