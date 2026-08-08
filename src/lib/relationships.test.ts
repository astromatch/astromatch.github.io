import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  return { ...actual, api: apiMock };
});

import {
  blueprintApi,
  normalizeBlueprintState,
  normalizePerson,
  normalizeRelationship,
  normalizeReport,
  peopleApi,
  relationshipsApi,
  type PersonInput,
} from "./relationships";

describe("relationship API boundary", () => {
  beforeEach(() => apiMock.mockReset());

  it("normalizes camelCase and snake_case person fields", () => {
    expect(
      normalizePerson({
        id: "p1",
        display_name: "M",
        relationship_type: "friend",
        birth_time_status: "unknown",
      }),
    ).toMatchObject({
      id: "p1",
      displayName: "M",
      relationshipType: "friend",
      birthTimeStatus: "unknown",
    });
  });

  it("normalizes explicit relationship status without inferring from report fields", () => {
    expect(
      normalizeRelationship({
        id: "m1",
        person_id: "p1",
        status: "ready",
        compatibility_status: "compatibility_ready",
        report_status: "report_generating",
        report: { headline: "Not ready" },
      }),
    ).toMatchObject({
      status: "ready",
      compatibilityStatus: "compatibility_ready",
      reportStatus: "report_generating",
    });
  });

  it("normalizes report categories and technical factors", () => {
    const report = normalizeReport({
      overall_score: 81,
      categories: [
        {
          key: "communication",
          label: "Communication",
          supporting_factors: [
            {
              planet_a: "Mercury",
              planet_b: "Moon",
              aspect: "trine",
              orb: 2.1,
            },
          ],
        },
      ],
    });
    expect(report.overallScore).toBe(81);
    expect(report.categories?.[0].supportingFactors?.[0]).toMatchObject({
      planetA: "Mercury",
      planetB: "Moon",
      aspect: "trine",
      orb: 2.1,
    });
  });

  it("uses documented People endpoints", async () => {
    apiMock.mockResolvedValueOnce([]);
    await peopleApi.all();
    expect(apiMock).toHaveBeenCalledWith("/api/v1/people", {
      signal: undefined,
    });
  });

  it("replaces a person through PATCH and archives through DELETE", async () => {
    const input: PersonInput = {
      displayName: "Private person",
      pronouns: null,
      relationshipType: "dating",
      notes: null,
      birthDate: "1997-08-27",
      birthTime: null,
      birthTimeStatus: "unknown",
      birthTimeAccuracyMinutes: null,
      birthPlaceLabel: "Dumraon, India",
      latitude: 25.55,
      longitude: 84.14,
      timezone: "Asia/Kolkata",
      astrologySystem: "western_tropical",
      dataConsentAcknowledged: true,
    };
    apiMock
      .mockResolvedValueOnce({ id: "p1", ...input })
      .mockResolvedValueOnce(undefined);
    await peopleApi.update("p1", input);
    expect(apiMock).toHaveBeenCalledWith("/api/v1/people/p1", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    await peopleApi.archive("p1");
    expect(apiMock).toHaveBeenLastCalledWith("/api/v1/people/p1", {
      method: "DELETE",
    });
  });

  it("maps explicit Blueprint status and generation endpoints", async () => {
    expect(
      normalizeBlueprintState({
        status: "ready",
        blueprint: {
          archetype: { title: "Connector", summary: "Summary" },
          emotionalNeeds: [],
          relationshipStrengths: [],
          growthEdges: [],
          datingPatterns: [],
          supportiveDynamics: [],
          reflectionPrompts: [],
          dataQuality: "high",
        },
      }),
    ).toMatchObject({
      status: "ready",
      blueprint: { archetype: { title: "Connector" }, dataQuality: "high" },
    });
    apiMock
      .mockResolvedValueOnce({ status: "not_generated", blueprint: null })
      .mockResolvedValueOnce({ status: "ready", blueprint: {} });
    await blueprintApi.get();
    expect(apiMock).toHaveBeenCalledWith("/api/v1/me/relationship-blueprint", {
      signal: undefined,
    });
    await blueprintApi.generate();
    expect(apiMock).toHaveBeenLastCalledWith(
      "/api/v1/me/relationship-blueprint/generate",
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }) }),
    );
  });

  it("uses separate deterministic compatibility and narrative generation endpoints", async () => {
    apiMock.mockResolvedValue({});
    await relationshipsApi.calculate("m1", "romantic");
    expect(apiMock).toHaveBeenCalledWith(
      "/api/v1/relationships/m1/compatibility/calculate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ focus: "romantic" }),
        headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }),
      }),
    );
    await relationshipsApi.generateReport("m1");
    expect(apiMock).toHaveBeenLastCalledWith(
      "/api/v1/relationships/m1/report/generate",
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }) }),
    );
  });

  it("creates the relationship with owned profile and person ids in the documented payload", async () => {
    const payload = {
      birth_profile_id: "birth-1",
      person_id: "person-1",
      relationship_type: "dating" as const,
      title: "Us",
    };
    apiMock.mockResolvedValueOnce({
      id: "relationship-1",
      ...payload,
      status: "draft",
      compatibility_status: "compatibility_not_generated",
      report_status: "report_not_generated",
    });
    await relationshipsApi.create(payload);
    expect(apiMock).toHaveBeenCalledWith("/api/v1/relationships", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });
});
