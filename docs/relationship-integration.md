# Relationship intelligence frontend integration

The frontend consumes the live AstroMatch OpenAPI contract served from
`/openapi.yaml`. All protected requests use the central Firebase-authenticated
API client.

## Integrated endpoints

- `GET/POST /api/v1/people`
- `GET/PUT /api/v1/people/{id}`
- `PATCH/DELETE /api/v1/people/{id}`
- `GET/POST /api/v1/relationships`
- `GET/PATCH/DELETE /api/v1/relationships/{id}`
- `POST /api/v1/relationships/{id}/compatibility/calculate`
- `GET /api/v1/relationships/{id}/compatibility`
- `POST /api/v1/relationships/{id}/report/generate`
- `GET /api/v1/relationships/{id}/report`
- `POST /api/v1/relationships/{id}/report/regenerate`
- `GET /api/v1/me/relationship-blueprint`
- `POST /api/v1/me/relationship-blueprint/generate`
- `POST /api/v1/me/relationship-blueprint/regenerate`

Deterministic compatibility and narrative report generation are represented as
separate UI and request stages.

## Backend blockers

### Response DTO alignment

The frontend boundary accepts both
camelCase and snake_case field names temporarily. The backend should publish
precise schemas for:

- person records and chart-generation state;
- relationship list and detail records;
- explicit compatibility and report statuses;
- compatibility categories and qualitative labels;
- report factors, limitations, regeneration eligibility and quota metadata.

Once those DTOs are published, replace boundary normalization with generated or
strictly maintained types.

## Privacy

- Private names, aliases, birth details, coordinates, UUIDs, report content,
  notes and raw astrology factors are excluded from analytics.
- UUIDs embedded in route paths are redacted before page-view tracking.
- Relationship pages add `noindex,nofollow`.
- Reports are private by default and do not expose birth details through share
  actions.
