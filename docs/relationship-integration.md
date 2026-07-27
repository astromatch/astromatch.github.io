# Relationship intelligence frontend integration

The frontend consumes the live AstroMatch OpenAPI contract served from
`/openapi.yaml`. All protected requests use the central Firebase-authenticated
API client.

## Integrated endpoints

- `GET/POST /api/v1/people`
- `GET/PUT /api/v1/people/{id}`
- `POST /api/v1/people/{id}/archive`
- `GET/POST /api/v1/matches`
- `GET/DELETE /api/v1/matches/{id}`
- `POST /api/v1/matches/{id}/generate`
- `GET /api/v1/matches/{id}/report`

Match generation always sends a unique `Idempotency-Key`. The frontend does
not automatically retry this expensive mutation after an ambiguous failure.

## Backend blockers

### Relationship Blueprint

The live OpenAPI currently has no Relationship Blueprint endpoint or DTO.
Production therefore shows an explicit integration-unavailable state and never
calculates or invents interpretations in frontend code.

For design development only, a clearly labelled fixture can be enabled with:

```env
VITE_ENABLE_DEV_FIXTURES=true
```

The fixture is excluded from the production path unless that flag is
deliberately enabled.

The backend should document endpoints for:

- retrieving the current blueprint and explicit status;
- requesting generation with an idempotency key;
- retrieving asynchronous generation status if applicable;
- regenerating only when allowed;
- quota/reset metadata;
- stale reason and source chart version;
- archetype, sections, prompts, source factors, limitations and data quality.

### People and Match response DTOs

People and Match operations currently return the generic `Success` response in
OpenAPI, without concrete response schemas. The frontend boundary accepts both
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
