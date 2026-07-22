# Analytics events

Analytics is consent-gated and disabled in local development by default. The adapter in `src/lib/analytics.ts` accepts only named events. Never pass names, email, Firebase UID, birth details, locations, question text, message text, or raw private entity IDs.

| Area | Events | Safe parameters |
|---|---|---|
| Navigation | `page_view`, `primary_cta_clicked`, `legal_page_viewed` | route, controlled CTA/page name |
| Authentication | `sign_up_started`, `sign_up_completed`, `login_completed`, `logout_completed` | method (`email`, `google`) |
| Onboarding | `onboarding_started`, `onboarding_step_viewed`, `birth_time_status_selected`, `onboarding_completed` | controlled step/status |
| People | `person_creation_started`, `person_created`, `person_updated`, `person_deleted` | relationship type, birth-time quality |
| Matching | `match_creation_started`, `match_focus_selected`, `match_generation_requested`, `match_generation_completed`, `match_generation_failed`, `match_report_viewed`, `match_report_saved`, `share_card_generated`, `share_started` | focus, quality, error category, channel |
| Ask | `ask_screen_viewed`, `suggested_question_clicked`, `astrology_question_submitted`, `astrology_answer_completed`, `astrology_answer_failed`, `astrology_answer_feedback` | context/category, controlled feedback value |

Use GA4 DebugView by enabling analytics in a non-production environment and activating Google Analytics debug mode in the browser. Do not enable it on shared devices containing real profile data.
