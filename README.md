# AstroMatch

Private, personalized astrology for your love life. This repository is a mobile-first React application deployed as a static SPA on GitHub Pages.

## Local setup

Requires Node.js 22+.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Firebase email/password and Google providers must be enabled in Firebase Console, and `localhost` plus `astromatch.world` must be authorized domains. Put browser configuration values in `.env.local`; never add an xAI or server credential to a `VITE_` variable.

## Verify

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

## Environment

See `.env.example`. Analytics is disabled unless `VITE_ENABLE_ANALYTICS=true` and the user grants consent. Development fixtures must be explicitly enabled; production paths do not silently fall back to mock API data.

## Routing and GitHub Pages

The app uses hash routing, so deep links such as `/#/matches/123/report` work without server rewrites. In repository **Settings → Pages**, choose **GitHub Actions** as the source. Add each public build value from `.env.example` as a repository Actions variable, then push to `main` or `master`. Configure the `astromatch.world` custom domain and DNS in Pages settings.

## Backend contract

The central client sends a Firebase ID token as `Authorization: Bearer …`, JSON content type, and an `X-Request-ID`. Expected authenticated endpoints under `/v1` cover user/profile, people CRUD, match generation and reports, conversations (streaming or JSON), saved items, data export, and account deletion. Responses should use `{ data, meta }` or `{ error, meta }`. The frontend performs no astronomical calculations and never receives an xAI key.

## Privacy

Private names, birth data, locations, emails, UIDs and question text must never enter analytics. Share cards should contain aliases/initials, score, short themes and AstroMatch branding only. See `docs/analytics-events.md` for the event catalogue.
