import { afterEach, describe, expect, it, vi } from "vitest";
import { waitForBackend, wakeBackend } from "./backendWake";

describe("backend readiness", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("waits for the documented readiness endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(waitForBackend(1, 0)).resolves.toBe("ready");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://astromatch-api-k996.onrender.com/ready",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  it("keeps the non-blocking wake helper", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));
    expect(wakeBackend()).toBeUndefined();
  });
});
