import { api, idempotencyHeaders } from "./api";

export type BirthTimeQuality = "exact" | "approximate" | "unknown";
export type PersonRelationship =
  | "partner"
  | "crush"
  | "spouse"
  | "ex"
  | "friend"
  | "dating"
  | "custom";
export type MatchFocus = "general" | "romantic" | "communication" | "long_term";
export type RelationshipStatus = "draft" | "ready" | "analysed" | "archived";
export type CompatibilityStatus =
  | "compatibility_not_generated"
  | "compatibility_calculating"
  | "compatibility_ready"
  | "compatibility_failed";
export type ReportStatus =
  | "report_not_generated"
  | "report_generating"
  | "report_ready"
  | "report_failed";
export type BlueprintStatus =
  | "not_generated"
  | "generating"
  | "ready"
  | "failed";
export type DataQuality = "limited" | "standard" | "high";

export interface BlueprintInsight {
  key: string;
  title: string;
  summary: string;
  detail: string;
  factor_ids: string[];
  confidence: "low" | "medium" | "high";
}

export interface RelationshipBlueprint {
  id?: string;
  archetype: { title: string; summary: string };
  emotionalNeeds: BlueprintInsight[];
  affectionStyle?: BlueprintInsight;
  attractionStyle?: BlueprintInsight;
  communicationStyle?: BlueprintInsight;
  conflictStyle?: BlueprintInsight;
  relationshipStrengths: BlueprintInsight[];
  growthEdges: BlueprintInsight[];
  datingPatterns: BlueprintInsight[];
  supportiveDynamics: BlueprintInsight[];
  reflectionPrompts: string[];
  dataQuality: DataQuality;
  calculationVersion?: string;
  promptVersion?: string;
}

export interface BlueprintState {
  status: BlueprintStatus;
  blueprint: RelationshipBlueprint | null;
  error?: string;
}

export interface PersonInput {
  displayName: string;
  pronouns: string | null;
  relationshipType: PersonRelationship;
  birthDate: string;
  birthTime: string | null;
  birthTimeStatus: BirthTimeQuality;
  birthTimeAccuracyMinutes: number | null;
  birthPlaceLabel: string;
  latitude: number;
  longitude: number;
  timezone: string;
  astrologySystem: "western_tropical";
  notes: string | null;
  dataConsentAcknowledged: boolean;
}

export interface PrivatePerson extends PersonInput {
  id: string;
  dataConsentAcknowledgedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  chartStatus?: string;
  dataQuality?: string;
}

export interface CompatibilityFactor {
  title?: string;
  label?: string;
  description?: string;
  interpretation?: string;
  direction?: string;
  planetA?: string;
  planetB?: string;
  aspect?: string;
  orb?: number;
}

export interface CompatibilityCategory {
  key: string;
  label: string;
  score?: number;
  headline?: string;
  interpretation?: string;
  dataQuality?: string;
  qualitativeLabel?: string;
  confidence?: "low" | "medium" | "high";
  supportingFactorIds?: string[];
  challengingFactorIds?: string[];
  supportingFactors?: CompatibilityFactor[];
  challengingFactors?: CompatibilityFactor[];
}

export interface CompatibilityReport {
  id?: string;
  status?: string;
  headline?: string;
  summary?: string;
  overallScore?: number;
  qualitativeLabel?: string;
  dataQuality?: string;
  strongestConnection?: { title?: string; body?: string; factorIds?: string[] };
  primaryFriction?: { title?: string; body?: string; factorIds?: string[] };
  categories?: CompatibilityCategory[];
  practicalGuidance?: Array<{
    title?: string;
    body: string;
    factorIds?: string[];
  }>;
  reflectionPrompts?: string[];
  factors?: CompatibilityFactor[];
  limitations?: string[];
  canRegenerate?: boolean;
  regenerationReason?: string;
}

export interface CompatibilityAnalysis {
  overall?: number;
  qualitativeLabel?: string;
  categories: CompatibilityCategory[];
  strengths: CompatibilityFactor[];
  challenges: CompatibilityFactor[];
  mixedDynamics: CompatibilityFactor[];
  aspects: CompatibilityFactor[];
  exclusions: string[];
  dataQuality?: string;
  calculationVersion?: string;
  interpretationVersion?: string;
}

export interface Relationship {
  id: string;
  birthProfileId: string;
  personId: string;
  focus?: MatchFocus;
  status: RelationshipStatus;
  compatibilityStatus: CompatibilityStatus;
  reportStatus: ReportStatus;
  title?: string | null;
  relationshipType?: PersonRelationship;
  person?: PrivatePerson;
  headline?: string;
  qualitativeLabel?: string;
  dataQuality?: string;
  score?: number;
  report?: CompatibilityReport;
  updatedAt?: string;
}

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown) =>
  typeof value === "string" ? value : undefined;
const number = (value: unknown) =>
  typeof value === "number" ? value : undefined;
const array = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

export function normalizePerson(value: unknown): PrivatePerson {
  const item = record(value);
  return {
    id: text(item.id) ?? "",
    displayName:
      text(item.displayName) ?? text(item.display_name) ?? "Private person",
    pronouns: text(item.pronouns) ?? null,
    relationshipType: (text(item.relationshipType) ??
      text(item.relationship_type) ??
      "custom") as PersonRelationship,
    birthDate: text(item.birthDate) ?? text(item.birth_date) ?? "",
    birthTime: text(item.birthTime) ?? text(item.birth_time) ?? null,
    birthTimeStatus: (text(item.birthTimeStatus) ??
      text(item.birth_time_status) ??
      "unknown") as BirthTimeQuality,
    birthTimeAccuracyMinutes:
      number(item.birthTimeAccuracyMinutes) ??
      number(item.birth_time_accuracy_minutes) ??
      null,
    birthPlaceLabel:
      text(item.birthPlaceLabel) ??
      text(item.birth_place_label) ??
      "Private location",
    latitude: number(item.latitude) ?? 0,
    longitude: number(item.longitude) ?? 0,
    timezone: text(item.timezone) ?? "UTC",
    astrologySystem: "western_tropical",
    notes: text(item.notes) ?? null,
    dataConsentAcknowledged:
      item.dataConsentAcknowledged === true ||
      item.data_consent_acknowledged === true,
    dataConsentAcknowledgedAt:
      text(item.dataConsentAcknowledgedAt) ??
      text(item.data_consent_acknowledged_at),
    createdAt: text(item.createdAt) ?? text(item.created_at),
    updatedAt: text(item.updatedAt) ?? text(item.updated_at),
    chartStatus: text(item.chartStatus) ?? text(item.chart_status),
    dataQuality: text(item.dataQuality) ?? text(item.data_quality),
  };
}

function normalizeCategory(
  value: unknown,
  index: number,
): CompatibilityCategory {
  const item = record(value);
  return {
    key: text(item.key) ?? text(item.category) ?? `category_${index}`,
    label:
      text(item.label) ??
      text(item.title) ??
      text(item.category) ??
      `Category ${index + 1}`,
    score: number(item.score),
    headline: text(item.headline),
    interpretation: text(item.interpretation) ?? text(item.description),
    dataQuality: text(item.dataQuality) ?? text(item.data_quality),
    qualitativeLabel:
      text(item.qualitativeLabel) ?? text(item.qualitative_label),
    confidence: text(item.confidence) as CompatibilityCategory["confidence"],
    supportingFactorIds: array(
      item.supportingFactorIds ?? item.supporting_factor_ids,
    ).filter((x): x is string => typeof x === "string"),
    challengingFactorIds: array(
      item.challengingFactorIds ?? item.challenging_factor_ids,
    ).filter((x): x is string => typeof x === "string"),
    supportingFactors: array(
      item.supportingFactors ?? item.supporting_factors,
    ).map(normalizeFactor),
    challengingFactors: array(
      item.challengingFactors ?? item.challenging_factors,
    ).map(normalizeFactor),
  };
}

function normalizeFactor(value: unknown): CompatibilityFactor {
  const item = record(value);
  return {
    title: text(item.title),
    label: text(item.label),
    description: text(item.description),
    interpretation: text(item.interpretation),
    direction: text(item.direction),
    planetA: text(item.planetA) ?? text(item.planet_a),
    planetB: text(item.planetB) ?? text(item.planet_b),
    aspect: text(item.aspect),
    orb: number(item.orb),
  };
}

export function normalizeReport(value: unknown): CompatibilityReport {
  const envelope = record(value);
  const item = record(envelope.report ?? value);
  const quality = record(item.dataQuality ?? item.data_quality);
  const connection = record(
    item.strongestConnection ?? item.strongest_connection,
  );
  const friction = record(item.primaryFriction ?? item.primary_friction);
  return {
    id: text(envelope.id) ?? text(item.id),
    status: text(item.status),
    headline:
      text(item.headline) ??
      text(item.overallHeadline) ??
      text(item.overall_headline),
    summary: text(item.summary),
    overallScore:
      number(item.overallScore) ??
      number(item.overall_score) ??
      number(item.score),
    qualitativeLabel:
      text(item.qualitativeLabel) ?? text(item.qualitative_label),
    dataQuality:
      text(item.dataQuality) ?? text(item.data_quality) ?? text(quality.level),
    strongestConnection: Object.keys(connection).length
      ? {
          title: text(connection.title),
          body: text(connection.body),
          factorIds: array(
            connection.factorIds ?? connection.factor_ids,
          ).filter((x): x is string => typeof x === "string"),
        }
      : undefined,
    primaryFriction: Object.keys(friction).length
      ? {
          title: text(friction.title),
          body: text(friction.body),
          factorIds: array(friction.factorIds ?? friction.factor_ids).filter(
            (x): x is string => typeof x === "string",
          ),
        }
      : undefined,
    categories: array(item.categories).map(normalizeCategory),
    practicalGuidance: array(
      item.practicalGuidance ?? item.practical_guidance,
    ).map((value) => {
      if (typeof value === "string") return { body: value };
      const guidance = record(value);
      return {
        title: text(guidance.title),
        body: text(guidance.body) ?? "",
        factorIds: array(guidance.factorIds ?? guidance.factor_ids).filter(
          (x): x is string => typeof x === "string",
        ),
      };
    }),
    reflectionPrompts: array(
      item.reflectionPrompts ?? item.reflection_prompts,
    ).filter((x): x is string => typeof x === "string"),
    factors: array(item.factors).map(normalizeFactor),
    limitations: [
      ...array(quality.limitations),
      ...array(item.limitations),
    ].filter((x): x is string => typeof x === "string"),
    canRegenerate: item.canRegenerate === true || item.can_regenerate === true,
    regenerationReason:
      text(item.regenerationReason) ?? text(item.regeneration_reason),
  };
}

export function normalizeCompatibility(value: unknown): CompatibilityAnalysis {
  const item = record(value);
  const overall = record(item.overall);
  return {
    overall: number(item.overall) ?? number(overall.score),
    qualitativeLabel:
      text(item.qualitativeLabel) ??
      text(item.qualitative_label) ??
      text(overall.qualitativeLabel) ??
      text(overall.qualitative_label),
    categories: array(item.categories).map(normalizeCategory),
    strengths: array(item.strengths).map(normalizeFactor),
    challenges: array(item.challenges).map(normalizeFactor),
    mixedDynamics: array(item.mixedDynamics ?? item.mixed_dynamics).map(
      normalizeFactor,
    ),
    aspects: array(item.aspects).map(normalizeFactor),
    exclusions: array(item.exclusions).filter(
      (x): x is string => typeof x === "string",
    ),
    dataQuality:
      text(item.dataQuality) ??
      text(item.data_quality) ??
      text(record(item.data_quality).level),
    calculationVersion:
      text(item.calculationVersion) ?? text(item.calculation_version),
    interpretationVersion:
      text(item.interpretationVersion) ?? text(item.interpretation_version),
  };
}

export function normalizeRelationship(value: unknown): Relationship {
  const item = record(value);
  const personValue = item.person ?? item.private_person;
  return {
    id: text(item.id) ?? "",
    birthProfileId:
      text(item.birthProfileId) ?? text(item.birth_profile_id) ?? "",
    personId:
      text(item.personId) ??
      text(item.person_id) ??
      text(record(personValue).id) ??
      "",
    focus: text(item.focus) as MatchFocus | undefined,
    status: (text(item.status) ?? "draft") as RelationshipStatus,
    compatibilityStatus: (text(item.compatibilityStatus) ??
      text(item.compatibility_status) ??
      "compatibility_not_generated") as CompatibilityStatus,
    reportStatus: (text(item.reportStatus) ??
      text(item.report_status) ??
      "report_not_generated") as ReportStatus,
    title: text(item.title) ?? null,
    relationshipType: (text(item.relationshipType) ??
      text(item.relationship_type)) as PersonRelationship | undefined,
    person: personValue ? normalizePerson(personValue) : undefined,
    headline: text(item.headline),
    qualitativeLabel:
      text(item.qualitativeLabel) ?? text(item.qualitative_label),
    dataQuality: text(item.dataQuality) ?? text(item.data_quality),
    score: number(item.score),
    report: item.report ? normalizeReport(item.report) : undefined,
    updatedAt: text(item.updatedAt) ?? text(item.updated_at),
  };
}

function listPayload(value: unknown) {
  if (Array.isArray(value)) return value;
  const item = record(value);
  return array(item.items ?? item.people ?? item.relationships ?? item.data);
}

export const relationshipQueryKeys = {
  blueprint: ["relationship-blueprint"] as const,
  people: ["people"] as const,
  person: (id: string) => ["people", id] as const,
  relationships: ["relationships"] as const,
  relationship: (id: string) => ["relationships", id] as const,
  compatibility: (id: string) =>
    ["relationships", id, "compatibility"] as const,
  report: (id: string) => ["relationships", id, "report"] as const,
};

export function normalizeBlueprintState(value: unknown): BlueprintState {
  const item = record(value);
  const status = (text(item.status) ??
    (item.blueprint || item.archetype
      ? "ready"
      : "not_generated")) as BlueprintStatus;
  const raw = record(item.blueprint ?? (status === "ready" ? item : null));
  const insight = (value: unknown): BlueprintInsight | undefined => {
    const entry = record(value);
    if (!text(entry.key) || !text(entry.title)) return undefined;
    return {
      key: text(entry.key)!,
      title: text(entry.title)!,
      summary: text(entry.summary) ?? "",
      detail: text(entry.detail) ?? "",
      factor_ids: array(entry.factor_ids).filter(
        (x): x is string => typeof x === "string",
      ),
      confidence: (text(entry.confidence) ??
        "medium") as BlueprintInsight["confidence"],
    };
  };
  const insights = (value: unknown) =>
    array(value)
      .map(insight)
      .filter((x): x is BlueprintInsight => Boolean(x));
  const blueprint =
    status === "ready"
      ? {
          id: text(raw.id),
          archetype: {
            title:
              text(record(raw.archetype).title) ??
              "Your relationship blueprint",
            summary: text(record(raw.archetype).summary) ?? "",
          },
          emotionalNeeds: insights(raw.emotionalNeeds ?? raw.emotional_needs),
          affectionStyle: insight(raw.affectionStyle ?? raw.affection_style),
          attractionStyle: insight(raw.attractionStyle ?? raw.attraction_style),
          communicationStyle: insight(
            raw.communicationStyle ?? raw.communication_style,
          ),
          conflictStyle: insight(raw.conflictStyle ?? raw.conflict_style),
          relationshipStrengths: insights(
            raw.relationshipStrengths ?? raw.relationship_strengths,
          ),
          growthEdges: insights(raw.growthEdges ?? raw.growth_edges),
          datingPatterns: insights(raw.datingPatterns ?? raw.dating_patterns),
          supportiveDynamics: insights(
            raw.supportiveDynamics ?? raw.supportive_dynamics,
          ),
          reflectionPrompts: array(
            raw.reflectionPrompts ?? raw.reflection_prompts,
          ).filter((x): x is string => typeof x === "string"),
          dataQuality: (text(raw.dataQuality) ??
            text(raw.data_quality) ??
            "limited") as DataQuality,
          calculationVersion:
            text(raw.calculationVersion) ?? text(raw.calculation_version),
          promptVersion: text(raw.promptVersion) ?? text(raw.prompt_version),
        }
      : null;
  return { status, blueprint, error: text(item.error) };
}

export const blueprintApi = {
  async get(signal?: AbortSignal) {
    return normalizeBlueprintState(
      await api<unknown>("/api/v1/me/relationship-blueprint", { signal }),
    );
  },
  async generate() {
    return normalizeBlueprintState(
      await api<unknown>("/api/v1/me/relationship-blueprint/generate", {
        method: "POST",
        headers: idempotencyHeaders(),
      }),
    );
  },
  async regenerate() {
    return normalizeBlueprintState(
      await api<unknown>("/api/v1/me/relationship-blueprint/regenerate", {
        method: "POST",
        headers: idempotencyHeaders(),
      }),
    );
  },
};

export const peopleApi = {
  async all(signal?: AbortSignal) {
    return listPayload(await api<unknown>("/api/v1/people", { signal })).map(
      normalizePerson,
    );
  },
  async get(id: string, signal?: AbortSignal) {
    return normalizePerson(
      await api<unknown>(`/api/v1/people/${id}`, { signal }),
    );
  },
  async create(input: PersonInput) {
    return normalizePerson(
      await api<unknown>("/api/v1/people", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  },
  async update(id: string, input: PersonInput) {
    return normalizePerson(
      await api<unknown>(`/api/v1/people/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    );
  },
  archive: (id: string) =>
    api<void>(`/api/v1/people/${id}`, { method: "DELETE" }),
};

export const relationshipsApi = {
  async all(signal?: AbortSignal) {
    return listPayload(
      await api<unknown>("/api/v1/relationships", { signal }),
    ).map(normalizeRelationship);
  },
  async get(id: string, signal?: AbortSignal) {
    return normalizeRelationship(
      await api<unknown>(`/api/v1/relationships/${id}`, { signal }),
    );
  },
  async create(input: {
    birth_profile_id: string;
    person_id: string;
    relationship_type: PersonRelationship;
    title: string | null;
  }) {
    return normalizeRelationship(
      await api<unknown>("/api/v1/relationships", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  },
  async update(
    id: string,
    patch: { relationship_type?: PersonRelationship; title?: string | null },
  ) {
    return normalizeRelationship(
      await api<unknown>(`/api/v1/relationships/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    );
  },
  async calculate(id: string, focus: MatchFocus) {
    return api<unknown>(`/api/v1/relationships/${id}/compatibility/calculate`, {
      method: "POST",
      headers: idempotencyHeaders(),
      body: JSON.stringify({ focus }),
    });
  },
  async compatibility(id: string, signal?: AbortSignal) {
    return normalizeCompatibility(
      await api<unknown>(`/api/v1/relationships/${id}/compatibility`, {
        signal,
      }),
    );
  },
  generateReport: (id: string) =>
    api<unknown>(`/api/v1/relationships/${id}/report/generate`, {
      method: "POST",
      headers: idempotencyHeaders(),
    }),
  async report(id: string, signal?: AbortSignal) {
    return normalizeReport(
      await api<unknown>(`/api/v1/relationships/${id}/report`, { signal }),
    );
  },
  async regenerateReport(id: string) {
    return normalizeReport(
      await api<unknown>(`/api/v1/relationships/${id}/report/regenerate`, {
        method: "POST",
        headers: idempotencyHeaders(),
      }),
    );
  },
  archive: (id: string) =>
    api<void>(`/api/v1/relationships/${id}`, { method: "DELETE" }),
};
