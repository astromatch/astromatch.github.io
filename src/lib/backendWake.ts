import { env } from "./env";

export type BackendReadiness = "ready" | "timeout" | "offline";
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function waitForBackend(attempts = 8, intervalMilliseconds = 4_000): Promise<BackendReadiness> {
  let reachedServer = false;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(`${env.VITE_API_BASE_URL}/ready`, {
        method: "GET", cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal,
      });
      reachedServer = true;
      if (response.ok) return "ready";
    } catch {
      // Sleeping Render services and offline clients are resolved after retries.
    } finally { clearTimeout(timer); }
    if (attempt < attempts - 1) await delay(intervalMilliseconds);
  }
  return reachedServer ? "timeout" : "offline";
}

export function wakeBackend() { void waitForBackend(1, 0); }
